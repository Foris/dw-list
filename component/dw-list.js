"use strict"

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
      let template;
      if(typeof options.data[0]['secondary'] != 'undefined'){
        template = "templates/items.html";
      }else{
        template = "templates/single.html";
      }
      $.get(urlBase + template, function( result ) {
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
              secondary: data['secondary']
            });
            // paint it
            $el.find('content .items').append(contentHtml);
          });

          // methods.order($el); // order
          events.startOrder($el, options); // events
        });
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
    },
    swap: function($el, $from, $to, $fromSelector, $toSelector, options){
        let $fromHtml = $fromSelector.html();
        $el.find('.indicator').html($fromHtml).removeClass('indicator').attr('data-id', $from);

        let $fromSelectorReview = $el.find('.items .item[data-id="' + $from + '"]');  // take the total of from item showed, for some reason sometimes are 2

        // prevent remove if for some reason are just one from item
        if($fromSelectorReview.length > 1){
          $fromSelector.remove();           // remove the active from item
          events.startOrder($el, options);  // re bind all items drags events
          $el.find('content .item').css('background-color','#fff')
          event.preventDefault();

          api.val($el);
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
    dragItemsOrder: function($el, options){
      let $items = $el.find('.items .item');

      $items.bind({
        dragstart: function(event){
          $from = $(event.target).data('id');
          $(event.target).addClass('fromMoved');

          $fromItemSelector = $el.find('.items .item[data-id="' + $from + '"]');

          $fromItemSelector.css('background-color', '#E5E8EC');

          // $fromItemSelector.css({
          //   'position': 'absolute',
          //   'width': itemWidth,
          //   'z-index': 99
          // });


        },
        dragenter: function(event){
          $to = $(event.target).data('id');

          $indicator = $el.find('.indicator');

          $toItem = $el.find('.items .item[data-id="' + $to + '"]');
          $indicator.remove();

          if(typeof options.data[0]['secondary'] != 'undefined'){
            $toItem.after('<li class="item indicator" draggable="true"></li>');
          }else{
            $toItem.after('<li class="item indicator" draggable="true" style="height:40px"></li>');
          }

        },
        dragover: function(event){
          if (event.preventDefault) {
            event.preventDefault(); // Necessary. Allows us to drop.
          }
        },
        dragend: function(event){

          $(event.target).removeClass('fromMoved');

          $fromItemSelector = $el.find('.items .item[data-id="' + $from + '"]');
          $toItemSelector = $el.find('.items .item[data-id="' + $to + '"]');

          methods.swap($el, $from, $to, $fromItemSelector, $toItemSelector, options);

        },
        drop: function(event){
          // not use this because the indicator item not listen the drop (no binding), for these reason i create a swap methods that interacting with the indicator in a indirectino way
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
        },
        dragenter: function(event){
          $to = $(event.target).data('id');
        },
        dragover: function(event){
          if (event.preventDefault) {
            event.preventDefault(); // Necessary. Allows us to drop.
          }
        },
        dragleave: function(event){
        },
        dragend: function(event){
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
