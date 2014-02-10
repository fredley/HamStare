// ==UserScript==
// @name HamStare
// @description Automate chat!
// @version 2.0
// @include http://chat.meta.stackoverflow.com/rooms/*
// @include http://chat.stackexchange.com/rooms/*
// @include http://chat.stackoverflow.com/rooms/*
// @include http://chat.askubuntu.com/rooms/*
// @run-at document-end
// ==/UserScript==

function livequery($) {
    /*! Copyright (c) 2010 Brandon Aaron (http://brandonaaron.net)
     * Dual licensed under the MIT (MIT_LICENSE.txt)
     * and GPL Version 2 (GPL_LICENSE.txt) licenses.
     *
     * Version: 1.1.1
     * Requires jQuery 1.3+
     * Docs: http://docs.jquery.com/Plugins/livequery
     */

    $.extend($.fn, {
        livequery: function(type, fn, fn2) {
            var self = this, q;
            if ($.isFunction(type))
                fn2 = fn, fn = type, type = undefined;
            $.each( $.livequery.queries, function(i, query) {
                if ( self.selector == query.selector && self.context == query.context &&
                    type == query.type && (!fn || fn.$lqguid == query.fn.$lqguid) && (!fn2 || fn2.$lqguid == query.fn2.$lqguid) )

                        return (q = query) && false;
            });
            q = q || new $.livequery(this.selector, this.context, type, fn, fn2);
            q.stopped = false;
            q.run();
            return this;
        },

        expire: function(type, fn, fn2) {
            var self = this;
            if ($.isFunction(type))
                fn2 = fn, fn = type, type = undefined;
            $.each( $.livequery.queries, function(i, query) {
                if ( self.selector == query.selector && self.context == query.context &&
                    (!type || type == query.type) && (!fn || fn.$lqguid == query.fn.$lqguid) && (!fn2 || fn2.$lqguid == query.fn2.$lqguid) && !this.stopped )
                        $.livequery.stop(query.id);
            });
            return this;
        }
    });

    $.livequery = function(selector, context, type, fn, fn2) {
        this.selector = selector;
        this.context  = context;
        this.type     = type;
        this.fn       = fn;
        this.fn2      = fn2;
        this.elements = [];
        this.stopped  = false;
        this.id = $.livequery.queries.push(this)-1;
        fn.$lqguid = fn.$lqguid || $.livequery.guid++;
        if (fn2) fn2.$lqguid = fn2.$lqguid || $.livequery.guid++;
        return this;
    };

    $.livequery.prototype = {
        stop: function() {
            var query = this;

            if ( this.type )
                this.elements.unbind(this.type, this.fn);
            else if (this.fn2)
                this.elements.each(function(i, el) {
                    query.fn2.apply(el);
                });
            this.elements = [];
            this.stopped = true;
        },

        run: function() {
            if ( this.stopped ) return;
            var query = this;

            var oEls = this.elements,
                els  = $(this.selector, this.context),
                nEls = els.not(oEls);
            this.elements = els;

            if (this.type) {
                nEls.bind(this.type, this.fn);
                if (oEls.length > 0)
                    $.each(oEls, function(i, el) {
                        if ( $.inArray(el, els) < 0 )
                            $.event.remove(el, query.type, query.fn);
                    });
            }
            else {
                nEls.each(function() {
                    query.fn.apply(this);
                });
                if ( this.fn2 && oEls.length > 0 )
                    $.each(oEls, function(i, el) {
                        if ( $.inArray(el, els) < 0 )
                            query.fn2.apply(el);
                    });
            }
        }
    };

    $.extend($.livequery, {
        guid: 0,
        queries: [],
        queue: [],
        running: false,
        timeout: null,

        checkQueue: function() {
            if ( $.livequery.running && $.livequery.queue.length ) {
                var length = $.livequery.queue.length;
                while ( length-- )
                    $.livequery.queries[ $.livequery.queue.shift() ].run();
            }
        },

        pause: function() {
            $.livequery.running = false;
        },

        play: function() {
            $.livequery.running = true;
            $.livequery.run();
        },

        registerPlugin: function() {
            $.each( arguments, function(i,n) {
                if (!$.fn[n]) return;

                var old = $.fn[n];

                $.fn[n] = function() {
                    var jQuery = $;
                    var r = old.apply(this, arguments);

                    jQuery.livequery.run();

                    return r;
                }
            });
        },

        run: function(id) {
            if (id != undefined) {
                if ( $.inArray(id, $.livequery.queue) < 0 )
                    $.livequery.queue.push( id );
            }
            else
                $.each( $.livequery.queries, function(id) {
                    if ( $.inArray(id, $.livequery.queue) < 0 )
                        $.livequery.queue.push( id );
                });

            // Clear timeout if it already exists
            if ($.livequery.timeout) clearTimeout($.livequery.timeout);
            $.livequery.timeout = setTimeout($.livequery.checkQueue, 20);
        },

        stop: function(id) {
            if (id != undefined)
                $.livequery.queries[ id ].stop();
            else
                $.each( $.livequery.queries, function(id) {
                    $.livequery.queries[ id ].stop();
                });
        }
    });

    $.livequery.registerPlugin('append', 'prepend', 'after', 'before', 'wrap', 'attr', 'removeAttr', 'addClass', 'removeClass', 'toggleClass', 'empty', 'remove', 'html');

    $(function() { $.livequery.play(); });
}

function inject() {
    for (var i = 0; i < arguments.length; ++i) {
        if (typeof(arguments[i]) == 'function') {
            var script = document.createElement('script');

            script.type = 'text/javascript';
            script.textContent = '(' + arguments[i].toString() + ')(jQuery)';

            document.body.appendChild(script);
        }
    }
}

inject(livequery, function ($) {

    function parse(){
        if(!$('.message:last').hasClass('parsed')){
            $('.message:last').addClass('parsed');
            var message = '';
            if($('.message:last').find('.content').html() != null){
                var msg = $('.message:last').find('.content').html();
                var usr = $('.message:last').parent().parent().find('.username:first').html();
                var words = msg.split(" ");
                var usernames = [];
                $('.user-gravatar32').each(function(){
                    usernames.push("@" + $(this).attr('title').replace(/\s+/g, ''));
                });
                if(usr == 'fredley'
                  && words.length >= 2
                  && words[0] == 'HamStare'
                  && words[1].charAt(0) == '@'
                  && usernames.indexOf(words[1]) > -1){
                    if(words[1] == '@fredley'){
                        message = usr + ' ಠ_ಠ ';
                    }else{
                        message = words[1] + ' ಠ_ಠ ';
                    }
                }else if(usr == 'fredley'
                  && words.length >= 2
                  && words[0] == 'HamStar'
                  && words[1].charAt(0) == '@'
                  && usernames.indexOf(words[1]) > -1){
                    var toStar = words[1];
                    $($(".user-container").get().reverse()).each(function() {
                        // find last message by user
                        if($(this).find('.username').html() == null) return true;
                        if('@' + $(this).find('.username').html().replace(/ /g,'') == toStar){
                            $(this).find('.message').last().find('.stars > .img').click();
                            return false;
                        }
                    });
                }
            }
            if(message != ''){
                $("textarea#input").val(message);
                $("#sayit-button").click();
            }
        }
    }

    $(document).ready(function() {
        var init = setInterval(function(){
            if($('.message').length > 0){
                $('#chat .message').livequery(parse);
                clearInterval(init);
            }
        }, 500);
    });
});

