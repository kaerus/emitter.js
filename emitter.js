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

    function Emitter() {
        if(!(this instanceof Emitter)) {
            return new Emitter();
        }  

        Object.defineProperty(this,'_events',{
            enumerable: false,
            value: {}
        });
    }

    Emitter.prototype.on = function(event,handler) {
        var e;
        
        if(!(e = this._events[event])) {
            this._events[event] = handler;
        } else if(!Array.isArray(e)) {
            if(e !== handler) this._events[event] = [e].concat(handler);  
        } else {
            if(e.indexOf(handler) < 0) e[e.length] = handler; 
        }    

        return this;
    }

    Emitter.prototype.before = function(event,handler) {
         return this.on(event,{before:handler});
    }

    Emitter.prototype.after = function(event,handler) {
         return this.on(event,{after:handler});
    }

    Emitter.prototype.hasEvent = function(name) {
        return !!this._events[name];
    }

    Emitter.prototype.off = function(event,handler) {
        if(!this._events[event]) return;

        if(!handler || !Array.isArray(this._events[event])) {
            if(!handler || this._events[event] === handler)
                delete this._events[event];
        } else {
            /* remove matching handlers */
            this._events[event] = this._events[event].filter(function(f){
                return f !== handler && f.before !== handler && f.after !== handler
            });
            /* undefines event when no handler is attached */
            /* or unwraps handler array on single handler. */
            if(!this._events[event].length) this._events[event] = undefined;
            else if(this._events[event].length === 1) 
                this._events[event] = e[0];
        }   

        return this;
    }

    Emitter.prototype.emit = function(event) {
        var e;

        if(!(e = this._events[event])) return;

        var args = Array.prototype.slice.call(arguments,1),
            handler, before, after = [], stop = false;

        if(!Array.isArray(e)) {
            e.apply(null,args);

            return this;
        }

        before = e.filter(function(f){return f.before});

        before.forEach(function(o){
            if(!stop) {
                if(o.before.apply(null,args) === false ) {
                    stop = true;
                }
            }
        });

        if(stop) return this;

        for (var i = 0, l = e.length; i < l; i++) {
            handler = e[i];
            if(typeof handler === 'function' ) {
                /* stop propagation on false */
                if( handler.apply(null,args) === false ) {
                    stop = true;
                    break;
                }
            } else if(typeof handler === 'object' && handler.after) {
                after[after.length] = handler.after;
            } /* silently ignore invalid handlers */   
        }

        after.forEach(function(handler){
            if(!stop) {
                if(handler.apply(null,args) === false ) {
                    stop = true;
                }
            }  
        });  

        return this;
    }

    Emitter.prototype.once = function(event,handler) {
        var self = this;

        this.on(event, function h() {
            self.off(event, h);
            handler.apply(null, arguments);
        });

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