/* 
* Copyright (c) 2012 Kaerus (kaerus.com), Anders Elo <anders @ kaerus com>.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/


var root;

try{root = global} catch(e){try {root = window} catch(e){root = this}};

(function () {
    "use strict"

    function Emitter(obj) {
        /* Emitter mixin */
        if(obj) {
            for(var key in Emitter.prototype) {
                obj[key] = Emitter.prototype[key];
            }
            obj._events = {};
            return obj;
        }

        if(!(this instanceof Emitter)) {
            return new Emitter;
        }

        this._events = {};  
    }

    Emitter.prototype.hasEvent = function(event) {
        return !!this._events[event];
    }

    Emitter.prototype.listeners = function(event) {
        var handlers = this._events[event];

        if(!handlers) return [];
        if(!Array.isArray(handlers)) return [handlers];
        
        return handlers;
    }

    Emitter.prototype.hasListeners = function(event) {
        return !!this._events[event];
    }

    Emitter.prototype.on = function(event,handler) {
        var e = this._events[event];
        
        if(!e) {
            this._events[event] = handler;
        } else if(!Array.isArray(e)) {
            if(e !== handler) this._events[event] = [e].concat(handler);  
        } else {
            if(e.indexOf(handler) < 0) e[e.length] = handler; 
        }    

        return this;
    }

    Emitter.prototype.before = function(event,handler) {
         return this.on(event,{_before:handler});
    }

    Emitter.prototype.after = function(event,handler) {
         return this.on(event,{_after:handler});
    }

    Emitter.prototype.off = function(event,handler) {
        handler = handler ? handler._off || handler : null;
        
        if(event){ 
            if(!this._events[event]) return;

            if(!handler) {
                this._events[event] = undefined;
            }
            else if(!Array.isArray(this._events[event])){
                if(this._events[event] === handler)
                    this._events[event] = undefined;    
            } else {

                this._events[event] = this._events[event].filter(function(f) {
                    return f !== handler && f._before !== handler && f._after !== handler
                });
                /* undefines event when no handler is attached */
                /* or unwraps handler array on single handler. */
                if(!this._events[event].length) this._events[event] = undefined;
                else if(this._events[event].length === 1) 
                    this._events[event] = this._events[event][0];
            } 
        }
        else {
            if(!handler) this._events = {};
            else {
                var events = Object.keys(this._events);
                for(var i = 0, l = events.length; i < l; i++)
                    this.off(events[i],handler);
            }
        } 

        return this;
    }

    Emitter.prototype.emit = function(event) {
        var handlers = this._events[event];

        if(!handlers) return;   

        var args = Array.prototype.slice.call(arguments,1),
            handler, before, after = [], done = false;

        if(!Array.isArray(handlers)) {
            handlers.apply(null,args);

            return this;
        }

        before = handlers.filter(function(f){return f._before});

        before.forEach(function(o){
            if(!done) {
                if(o._before.apply(null,args) === false ) {
                    done = true;
                }
            }
        });

        if(done) return this;

        for (var i = 0, l = handlers.length; i < l; i++) {
            handler = handlers[i];
            if(typeof handler === 'function' ) {
                /* stop propagation on false */
                if( handler.apply(null,args) === false ) {
                    done = true;
                    break;
                }
            } else if(typeof handler === 'object' && handler._after) {
                after[after.length] = handler._after;
            } /* silently ignore invalid handlers */   
        }

        if(done) return this;

        after.forEach(function(handler){
            if(!done) {
                if(handler.apply(null,args) === false ) {
                    done = true;
                }
            }  
        });  

        return this;
    }

    Emitter.prototype.once = function(event,handler) {
        var self = this;

        function once() {
            self.off(event, once);
            handler.apply(null, arguments);
        }

        this.on(event, once);
        handler._off = once;

        return this;
    }

    if (typeof exports === 'object') {  
        if (typeof module !== undefined && module.exports) {
            exports = module.exports = Emitter;
        } else exports.Emitter = Emitter;
    } else if (typeof define === 'function' && define.amd) {
        define(function () { return Emitter; });
    } else if(typeof root === 'object') {
        root.Emitter = Emitter; 
    } else throw "Failed to export module";

}());