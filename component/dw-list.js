
// dwFilter
(function( $ ){
  "use strict"

  var scripts = document.getElementsByTagName("script");
  var urlBase = scripts[scripts.length-1].src;
  urlBase = urlBase.replace('dw-list.js', '');

  let $from;
  let $to;

  let $fromItem;
  let $toItem;

  let $fromItemSelector;
  let $toItemSelector;

  // Public methods
  let api = {
    init : function(options) {
      const $el = $(this);
      (options.add) ? methods.addItem($el, options) : methods.newComponent($el, options);
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
      let $content = $el.find('.items .group-content');
      $content.show();

      // previene cuando no hay input
      let $items = $el.find('.items .option');
      $items.show();

      // deselect
      $items.removeClass('selected')
      $el.data('result','')

    }
  }

  // Private methods
  let methods = {

    newComponent: function($el, options){
      // deploy component structure
      let deployment = new Promise(function(resolve, reject){
        methods.deployComponent($el, options);
        resolve();
      })
      deployment.then(function(){
        methods.getTemplate($el, options);
      })
    },

    addItem: function($el, options){
      (typeof $el === 'undefined' || $el === null ) ? $el = $(this) : null;
      methods.orderTemplate($el, options);
    },

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
        id: options['name']
      }) );

      if (typeof options !== 'undefined') {
        methods.itemTemplate($el, options)
      } // Todo: falta cuando no trae contenido - $('#sample1').dwSelect()

    },
    itemTemplate: function($el, options){

      switch(options.type){
        case 'change':
          methods.changeTemplate($el, options);
          break;
        case 'order':
          methods.orderTemplate($el, options);
          break;
      }
    },
    orderTemplate: function($el, options){
      let optionsData = (options.add) ? options['add'] : options.data;
      // put items
      let template;
      console.log("optionsData.length: ", optionsData.length);
      if(optionsData.length == 0){
        console.log('empty')
        events.startOrder($el, options); // events
      }else{
        if(typeof optionsData[0]['secondary'] != 'undefined'){
          template = "templates/items.html";
        }else{
          template = "templates/single.html";
        }
        $.get(urlBase + template, function( result ) {
          let template = _.template(result);
          // let data = options['data'];
          let data = _.sortBy(optionsData, 'priority');

          // options each
          data.forEach(function (data, i) {
            let contentHtml = template({
              id: data['id'],
              priority: i + 1,
              primary: data['primary'],
              secondary: data['secondary']
            });
            // paint it
            $el.find('content .items').append(contentHtml);
          });


          events.startOrder($el, options); // events
          api.val($el); // trigger items ids
        });
      }
    },

    getVal: function($el){
      // update $el data
      let items = $el.find('.items .item').toArray();
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

    },
    updatePosition: function($el){
      let $items = $el.find('.item').toArray();
      $items.forEach(function(item, i){
        $(item).find('.position').text(i+1);
      });
    }
  }


  // Events
  var events = {

    startOrder: function($el, options){
      if(!options.add){
        // sortable
        let sortable = options.sortable;
        if(sortable){
          Sortable.create(document.getElementById(options['name']), {});
          events.dragItemsOrder($el, options);
        }else{
          Sortable.create(document.getElementById(options['name']), {});
          console.log("startOrder");
          $el.find('.item > .left').remove();
        }
      }
      methods.updatePosition($el);
      events.removeItem($el, options);

    },
    dragItemsOrder: function($el, options){
      let $items = $el.find('.items .item');

      $items.bind({
        dragstart: function(event){
          $(event.target).addClass('indicator');
        },
        dragenter: function(event){
          $to = $(event.target).data('id');
          methods.updatePosition($el);
        },
        dragover: function(event){
        },
        dragend: function(event){
          $(event.target).removeClass('indicator');
          api.val($el); // trigger update ids
        },
        drop: function(event){
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
    },
    removeItem: function($el, options){
      let $rm = $el.find('.remove');
      $rm.on({
        click: function(event){
          console.log("remove");
          let $this = $(event.target);
          $this.parent().remove();
          api.val($el);
        }
      })
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
