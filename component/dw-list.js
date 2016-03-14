var scripts = document.getElementsByTagName("script");
var urlBase = scripts[scripts.length-1].src;
urlBase = urlBase.replace('dw-list.js', '');

// dwFilter
(function( $ ){
  "use strict"

  // Public methods
  let api = {
    init : function(options) {
      const $el = $(this);
      // deploy component structure
      let deployment = new Promise(function(resolve, reject){
        methods.deployComponent($el, options);
        resolve()
      })
      deployment.then(function(){
        methods.getTemplate($el, options);
      })
    },
    destroy: function(){
      const $el = $(this);
      $el.empty();
      $el.removeClass('dw-list');
    },
    val: function($el){
      (typeof $el === 'undefined' || $el === null ) ? $el = $(this) : null;
      methods.getVal($el);
    },
    restart: function($el){
      // previene cuando no hay input
      let $groups = $el.find('.items .group');
      let $groupsContent = $el.find('.items .group-content');
      $groups.show();
      $groupsContent.show();

      // previene cuando no hay input
      let $items = $el.find('.items .option');
      $items.show();

      // deselect
      $items.removeClass('selected')
      $el.data('result','')

    },
  }

  // Private methods
  let methods = {

    deployComponent: function($el, options){
      // convert the div into a dw-filter component
      $el.addClass('dw-list');
    },

    getTemplate: function($el, options){

      $.get(urlBase + "templates/dw-list.html", function( result ) {
        let templateContent = result;
        methods.setTemplate($el, templateContent, options)
      });

    },

    setTemplate : function($el, templateContent, options){

      let template = _.template(templateContent);
      $el.html( template({
        'placeholder': options.placeholder
      }) );

      if (typeof options !== 'undefined') {
        methods.itemTemplate($el, options)
      } // Todo: falta cuando no trae contenido - $('#sample1').dwSelect()

    },
    itemTemplate: function($el, options){

      let data = options.data[0];

      // If has groups, paint groups containers
      if( data.hasOwnProperty('group') ){
        // define groups
        let groups =  _.chain(options.data).flatten().pluck('group').flatten().unique().value().sort();

        // paint groups containers
        _.each(groups, function(group){
          $el.find('content > .items').append('<div class="group" id="' + group + '"><div class="title"><span class="name">' + group + '</span><span class="open"></span></div></div><div class="group-content ' + group + '"></div>')
        })

        // put options into its group
        $.get(urlBase + "templates/items.html", function( result ) {
            let template = _.template(result);

            let data = _.sortBy(options['data'], 'primary');

            // options each
            data.forEach(data => {
              let contentHtml = template({
                id: data['id'],
                primary: data['primary'],
                secundary: data['secundary']
              });
              // paint in specific group content
              let group = data['group'];
              $el.find('.' + group + '.group-content').append(contentHtml);
            });

            events.start($el, options);
          });

      }else{
        // no groups
        // put options into its group
        $.get(urlBase + "templates/options.html", function( result ) {
            let template = _.template(result);

            let data = _.sortBy(options['data'], 'primary');

            // options each
            options['data'].forEach(data => {
              let contentHtml = template({
                id: data['id'],
                primary: data['primary'],
                secundary: data['secundary']
              });
              $el.find('content > .items').append(contentHtml);
            });

            events.start($el, options);
          });
      }

    },
    hideOptions: function($el, inputData, options){

      if( options.data[0].hasOwnProperty('group') ){

        let firstLetter = inputData.charAt(0);
        (firstLetter != ':') ? methods.hideOption($el, inputData, options) : methods.hideGroups($el, inputData, options);

      }

    },
    hideOption: function($el, inputData, options){
      let $option = $el.find('.option').toArray();

      $option.forEach(opt => {

        const $opt = $(opt);
        let tempPrimary = $opt.find('.primary').text();
        let tempSecundary = $opt.find('.secundary').text();

        tempPrimary = tempPrimary.toLowerCase();
        tempSecundary = tempSecundary.toLowerCase();

        inputData = inputData.toLowerCase();

        ( tempPrimary.indexOf(inputData) != -1 || tempSecundary.indexOf(inputData) != -1 ) ? $opt.show() : $opt.hide();

      });

    },
    hideGroups: function($el, inputData, options){
      let $groups = $el.find('.items .group').toArray();

      $groups.forEach(grp => {
        const $grp = $(grp);
        let tempInput = $grp.find('.title .name').text()

        if ( inputData.indexOf(' ') != -1 ){
          let optTemp = inputData.split(' ');

          // groups

          optTemp[0] = optTemp[0].toLowerCase();
          optTemp[0] = optTemp[0].replace(':','');
          ( tempInput.indexOf(optTemp[0]) != -1 ) ? $grp.show() : $grp.hide();
          ( tempInput.indexOf(optTemp[0]) != -1 ) ? $grp.next().show() : $grp.next().hide();



          // options

          let $option = $el.find('.option').toArray();

          $option.forEach(opt => {

            const $opt = $(opt);
            let tempPrimary = $opt.find('.primary').text();
            let tempSecundary = $opt.find('.secundary').text();

            tempPrimary = tempPrimary.toLowerCase();
            tempSecundary = tempSecundary.toLowerCase();

            optTemp[1] = optTemp[1].toLowerCase();

            ( tempPrimary.indexOf(optTemp[1]) != -1 || tempSecundary.indexOf(optTemp[1]) != -1 ) ? $opt.show() : $opt.hide();

          });

        }else{

          tempInput = tempInput.toLowerCase();
          inputData = inputData.replace(':','');
          inputData = inputData.toLowerCase();
          ( tempInput.indexOf(inputData) != -1 ) ? $grp.show() : $grp.hide();
          ( tempInput.indexOf(inputData) != -1 ) ? $grp.next().show() : $grp.next().hide();
        }
      });

    },
    getVal: function($el){
      // update $el data
      let items = $el.find('.items .option.selected').toArray();
      let ids = [];
      for(let i in items){
        let $itm = $(items[i]);
        ids.push($itm.data('id'));
      }
      $el.data('result', ids);
      methods.passResult($el);
      return ids;
    },
    passResult: function($el){
      $el.trigger('change');
    },
    showSelected: function($el, $target, options){
      let $search = $el.find('.search input');
      let primaryContent = $( $target.parent() ).find('.primary').text();

      $search.val(primaryContent);
      $search.focus();

    }
  }


  // Events
  var events = {

    start: function($el, options){
      // events.onSearch($el, options);
      // events.clearSearch($el, options);
      // events.clickItems($el, options);
      // events.clickOut($el, options);
      events.dragItems($el, options);
    },
    // initOptions: function($el, options){
    //   let $option = $el.find('content > .options > .option');
    //   $option.removeClass('hide');
    //   $option.css({
    //     'display': 'block'
    //   })
    // },
    toggleGroup: function($el, options){
    },
    clickItems: function($el, options){
      let $items = $el.find('.items .item');
      $items.on({
        click: function(event){
          // event.preventDefault();
          // event.stopPropagation();
          // // mark as selected
          // $options.removeClass('selected');
          // $(event.target).parent().toggleClass('selected');
          // api.val($el);
          // // show selected option
          // methods.showSelected( $el, $(event.target), options )
        }
      })
    },
    dragItems: function($el, options){
      let $items = $el.find('.items .item');

      let $from;
      let $to;

      let $fromItem;
      let $toItem;

      $items.on({
        dragstart: function(event){
          $from = $(event.target).data('id');
          console.log("from: ", $from);
        },
        dragenter: function(event){
          $to = $(event.target).parent().data('id');
          // console.log("to: ", $to);
        },
        dragover: function(event){
          if (event.preventDefault) {
            event.preventDefault(); // Necessary. Allows us to drop.
          }

        },
        dragleave: function(event){
          // console.log('dragleave', $(event.target))
        },
        dragend: function(event){
          // console.log('dragend', $(event.target))
          $fromItem = $el.find('.items .item[data-id="' + $from + '"]');
          $toItem = $el.find('.items .item[data-id="' + $to + '"]');

          let $fromItemHtml = $fromItem.html();
          let $toItemHtml = $toItem.html();

          $fromItem.html($toItemHtml);
          $toItem.html($fromItemHtml);

          console.log("$fromItem: ", $from, $fromItem);
          console.log("$toItem: ", $to, $toItem);
        }
      })
    },
    clickOut: function($el, options){
      let $items = $el.find('content > .items');
      let $clear = $el.find('.clear');
      $(document).mouseup(function (e)
      {
          if (!$el.is(e.target) // if the target of the click isn't the $el...
              && $el.has(e.target).length === 0) // ... nor a descendant of the $el
          {
              $items.addClass('hide');
              $clear.addClass('hide')
          }
      });
    }

  };


  // jquery component stuff
  $.fn.dwList = function(methodOrOptions) {
      if ( api[methodOrOptions] ) {
          return api[ methodOrOptions ].apply( this, Array.prototype.slice.call( arguments, 1 ))
      } else if ( typeof methodOrOptions === 'object' || ! methodOrOptions ) {
          // Default to "init"
          return api.init.apply( this, arguments )
      } else {
          $.error( 'Method ' +  methodOrOptions + ' does not exist on jQuery.dwList' )
      }
  };


})( jQuery )
