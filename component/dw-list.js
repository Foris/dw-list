var scripts = document.getElementsByTagName("script");
var urlBase = scripts[scripts.length-1].src;
urlBase = urlBase.replace('dw-list.js', '');

let $from;
let $to;

let $fromItem;
let $toItem;

let $indicator;

let $fromItemSelector;
let $toItemSelector;

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
      let $content = $el.find('.items .group-content');
      $content.show();

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
      $el.html( template() );

      if (typeof options !== 'undefined') {
        methods.itemTemplate($el, options)
      } // Todo: falta cuando no trae contenido - $('#sample1').dwSelect()

    },
    itemTemplate: function($el, options){
      let data = options.data[0];

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
      // put items
      $.get(urlBase + "templates/items.html", function( result ) {
          let template = _.template(result);
          // let data = options['data'];
          let data = _.sortBy(options['data'], 'priority');

          // options each
          data.forEach(function (data, i) {
            let contentHtml = template({
              id: data['id'],
              priority: i + 1,
              // priority: data['priority'],
              primary: data['primary'],
              secundary: data['secundary']
            });
            // paint it
            $el.find('content .items').append(contentHtml);
          });

          // methods.order($el); // order
          events.startOrder($el, options); // events
        });
    },
    changeTemplate: function($el, options){

      // put items
      $.get(urlBase + "templates/items.html", function( result ) {
          let template = _.template(result);
          // let data = options['data'];
          let data = _.sortBy(options['data'], 'priority');

          // options each
          data.forEach(function (data, i) {
            let contentHtml = template({
              id: data['id'],
              priority: i + 1,
              // priority: data['priority'],
              primary: data['primary'],
              secundary: data['secundary']
            });
            // paint it
            $el.find('content .items').append(contentHtml);
          });

          // methods.order($el); // order
          events.startChange($el, options); // events
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

    },
    updatePosition: function($el){
      let $items = $el.find('.item').toArray();
      $items.forEach(function(item, i){
        $(item).find('.position').text(i+1);
      });
    },
    swap: function($el, $from, $to, $fromSelector, $toSelector, options){
      // console.log("$el: ", $el);
      // console.log("$from: ", $from);
      // console.log("$to: ", $to);
      // console.log("$toSelector: ", $toSelector);
      //

        let $fromHtml = $fromSelector.html();
        $el.find('.indicator').html($fromHtml).removeClass('indicator').attr('data-id', $from);

        let $fromSelectorReview = $el.find('.items .item[data-id="' + $from + '"]');
        console.log("$fromSelector: ", $fromSelector.length);

        if($fromSelectorReview.length > 1){

          $fromSelector.remove();


          events.startOrder($el, options);
          event.preventDefault();
        }




    }
  }


  // Events
  var events = {

    startOrder: function($el, options){
      events.dragItemsOrder($el, options);
      methods.updatePosition($el);

    },
    startChange: function($el, options){
      events.dragItemsChange($el, options);
    },
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
    dragItemsOrder: function($el, options){
      let $items = $el.find('.items .item');



      $items.bind({
        dragstart: function(event){
          $from = $(event.target).data('id');
          $(event.target).addClass('fromMoved');

          $fromItemSelector = $el.find('.items .item[data-id="' + $from + '"]');

          let itemWidth = $fromItemSelector.outerWidth();

          // $fromItemSelector.css({
          //   'position': 'absolute',
          //   'width': itemWidth,
          //   'z-index': 99
          // });
        },
        dragenter: function(event){
          $to = $(event.target).data('id');

          // console.log("to: ", $to);
          $indicator = $el.find('.indicator');

          $toItem = $el.find('.items .item[data-id="' + $to + '"]');
          $indicator.remove();
          $toItem.after('<li class="item indicator" draggable="true"></li>');
          events.indicator($el, $indicator);

        },
        dragover: function(event){
          if (event.preventDefault) {
            event.preventDefault(); // Necessary. Allows us to drop.
          }
        },
        dragend: function(event){
          // console.log('dragend', $(event.target))
          $(event.target).removeClass('fromMoved');

          $fromItemSelector = $el.find('.items .item[data-id="' + $from + '"]');
          $toItemSelector = $el.find('.items .item[data-id="' + $to + '"]');

          methods.swap($el, $from, $to, $fromItemSelector, $toItemSelector, options);
          // events.startOrder($el, options);

        },
        drop: function(event){

        }
      })

    },
    indicator: function($el, $indicator){
      $indicator.bind({
        startdrag: function(event){
          alert('ok')
        }
      })
    },
    dragItemsChange: function($el, options){
      let $items = $el.find('.items .item');

      let $from;
      let $to;

      let $fromItem;
      let $toItem;

      $items.bind({
        dragstart: function(event){
          $from = $(event.target).data('id');
          $el.find('.item').css({
            'background': '#fff'
          })
          $(event.target).addClass('fromMoved');
          // console.log("from: ", $from);
        },
        dragenter: function(event){
          $to = $(event.target).data('id');
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
          $(event.target).removeClass('fromMoved');
        },
        drop: function(event){
          $fromItem = $el.find('.items .item[data-id="' + $from + '"]');
          $toItem = $el.find('.items .item[data-id="' + $to + '"]');

          let $fromItemHtml = $fromItem.html();
          let $toItemHtml = $toItem.html();

          $fromItem.html($toItemHtml);
          $toItem.html($fromItemHtml);

          let $fromItemPriority = $fromItem.find('.position').text();
          let $toItemPriority = $toItem.find('.position').text();

          $fromItem.find('.position').text($toItemPriority);
          $toItem.find('.position').text($fromItemPriority);

          $fromItem.data('place', $toItemPriority)
          $toItem.data('place', $fromItemPriority)

          // prevent different background
          $el.find('.item').css({
            'background': '#fff'
          })

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
