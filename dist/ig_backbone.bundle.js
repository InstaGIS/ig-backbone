(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('jquery'), require('underscore')) :
  typeof define === 'function' && define.amd ? define(['exports', 'jquery', 'underscore'], factory) :
  (factory((global.window = global.window || {}),global.$,global._));
}(this, (function (exports,$,_) { 'use strict';

$ = 'default' in $ ? $['default'] : $;
_ = 'default' in _ ? _['default'] : _;

//     Backbone.js 1.3.3

//     (c) 2010-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org
// Establish the root object, `window` (`self`) in the browser, or `global` on the server.
// We use `self` instead of `window` for `WebWorker` support.
var root = typeof self == 'object' && self.self === self && self || typeof global == 'object' && global.global === global && global;

// Initial Setup
// -------------
var previousBackbone = root.Backbone;

// Create a local reference to a common array method we'll want to use later.
var slice = Array.prototype.slice;

// Current version of the library. Keep in sync with `package.json`.
var Backbone$1 = {
  VERSION: '1.3.3-es6'
};

// For Backbone's purposes, jQuery, Zepto, Ender, or My Library (kidding) owns
// the `$` variable.
Backbone$1.$ = $;

// Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
// to its previous owner. Returns a reference to this Backbone object.
Backbone$1.noConflict = function () {
  root.Backbone = previousBackbone;
  return this;
};

// Proxy Backbone class methods to Underscore functions, wrapping the model's
// `attributes` object or collection's `models` array behind the scenes.
//
// collection.filter(function(model) { return model.get('age') > 10 });
// collection.each(this.addView);
//
// `Function#apply` can be slow so we use the method's arg count, if we know it.
var addMethod = function addMethod(length, method, attribute) {
  switch (length) {
    case 1:
      return function () {
        return _[method](this[attribute]);
      };
    case 2:
      return function (value) {
        return _[method](this[attribute], value);
      };
    case 3:
      return function (iteratee, context) {
        return _[method](this[attribute], cb(iteratee, this), context);
      };
    case 4:
      return function (iteratee, defaultVal, context) {
        return _[method](this[attribute], cb(iteratee, this), defaultVal, context);
      };
    default:
      return function () {
        var args = slice.call(arguments);
        args.unshift(this[attribute]);
        return _[method].apply(_, args);
      };
  }
};
var addUnderscoreMethods = function addUnderscoreMethods(Class, methods, attribute) {
  _.each(methods, function (length, method) {
    if (_[method]) Class.prototype[method] = addMethod(length, method, attribute);
  });
};

// Support `collection.sortBy('attr')` and `collection.findWhere({id: 1})`.
var cb = function cb(iteratee, instance) {
  if (_.isFunction(iteratee)) return iteratee;
  if (_.isObject(iteratee) && !instance._isModel(iteratee)) return modelMatcher(iteratee);
  if (_.isString(iteratee)) return function (model) {
    return model.get(iteratee);
  };
  return iteratee;
};
var modelMatcher = function modelMatcher(attrs) {
  var matcher = _.matches(attrs);
  return function (model) {
    return matcher(model.attributes);
  };
};

// Throw an error when a URL is needed, and none is supplied.
var urlError = function urlError() {
  throw new Error('A "url" property or function must be specified');
};

// Wrap an optional error callback with a fallback error event.
var wrapError = function wrapError(model, options) {
  var error = options.error;
  options.error = function (resp) {
    if (error) error.call(options.context, model, resp, options);
    model.trigger('error', model, resp, options);
  };
};

// Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
// will fake `"PATCH"`, `"PUT"` and `"DELETE"` requests via the `_method` parameter and
// set a `X-Http-Method-Override` header.
Backbone$1.emulateHTTP = false;

// Turn on `emulateJSON` to support legacy servers that can't deal with direct
// `application/json` requests ... this will encode the body as
// `application/x-www-form-urlencoded` instead and will send the model in a
// form param named `model`.
Backbone$1.emulateJSON = false;

// Map from CRUD to HTTP for our default `Backbone.sync` implementation.
var methodMap = {
  'create': 'POST',
  'update': 'PUT',
  'patch': 'PATCH',
  'delete': 'DELETE',
  'read': 'GET'
};
// Backbone.sync
// -------------

// Override this function to change the manner in which Backbone persists
// models to the server. You will be passed the type of request, and the
// model in question. By default, makes a RESTful Ajax request
// to the model's `url()`. Some possible customizations could be:
//
// * Use `setTimeout` to batch rapid-fire updates into a single request.
// * Send up the models as XML instead of JSON.
// * Persist models via WebSockets instead of Ajax.
//
// Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
// as `POST`, with a `_method` parameter containing the true HTTP method,
// as well as all requests with the body as `application/x-www-form-urlencoded`
// instead of `application/json` with the model in a param named `model`.
// Useful when interfacing with server-side languages like **PHP** that make
// it difficult to read the body of `PUT` requests.
Backbone$1.sync = function (method, model, options) {
  var type = methodMap[method];

  // Default options, unless specified.
  _.defaults(options || (options = {}), {
    emulateHTTP: Backbone$1.emulateHTTP,
    emulateJSON: Backbone$1.emulateJSON
  });

  // Default JSON-request options.
  var params = {
    type: type,
    dataType: 'json'
  };

  // Ensure that we have a URL.
  if (!options.url) {
    params.url = _.result(model, 'url') || urlError();
  }

  // Ensure that we have the appropriate request data.
  if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
    params.contentType = 'application/json';
    params.data = JSON.stringify(options.attrs || model.toJSON(options));
  }

  // For older servers, emulate JSON by encoding the request into an HTML-form.
  if (options.emulateJSON) {
    params.contentType = 'application/x-www-form-urlencoded';
    params.data = params.data ? {
      model: params.data
    } : {};
  }

  // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
  // And an `X-HTTP-Method-Override` header.
  if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
    params.type = 'POST';
    if (options.emulateJSON) params.data._method = type;
    var beforeSend = options.beforeSend;
    options.beforeSend = function (xhr) {
      xhr.setRequestHeader('X-HTTP-Method-Override', type);
      if (beforeSend) return beforeSend.apply(this, arguments);
    };
  }

  // Don't process data on a non-GET request.
  if (params.type !== 'GET' && !options.emulateJSON) {
    params.processData = false;
  }

  // Pass along `textStatus` and `errorThrown` from jQuery.
  var error = options.error;
  options.error = function (xhr, textStatus, errorThrown) {
    options.textStatus = textStatus;
    options.errorThrown = errorThrown;
    if (error) error.call(options.context, xhr, textStatus, errorThrown);
  };

  // Make the request, allowing the user to override any Ajax options.
  var xhr = options.xhr = Backbone$1.ajax(_.extend(params, options));
  model.trigger('request', model, xhr, options);
  return xhr;
};

// Set the default implementation of `Backbone.ajax` to proxy through to `$`.
// Override this if you'd like to use a different library.
Backbone$1.ajax = function () {
  return Backbone$1.$.ajax.apply(Backbone$1.$, arguments);
};

// Backbone.Events
// ---------------

// A module that can be mixed in to *any object* in order to provide it with
// a custom event channel. You may bind a callback to an event with `on` or
// remove with `off`; `trigger`-ing an event fires all callbacks in
// succession.
//
//     var object = {};
//     _.extend(object, Backbone.Events);
//     object.on('expand', function(){ alert('expanded'); });
//     object.trigger('expand');
//
var Events = Backbone$1.Events = {};

// Regular expression used to split event strings.
var eventSplitter = /\s+/;

// Iterates over the standard `event, callback` (as well as the fancy multiple
// space-separated events `"change blur", callback` and jQuery-style event
// maps `{event: callback}`).
var eventsApi = function eventsApi(iteratee, events, name, callback, opts) {
  var i = 0,
      names;
  if (name && typeof name === 'object') {
    // Handle event maps.
    if (callback !== void 0 && 'context' in opts && opts.context === void 0) opts.context = callback;
    for (names = _.keys(name); i < names.length; i++) {
      events = eventsApi(iteratee, events, names[i], name[names[i]], opts);
    }
  } else if (name && eventSplitter.test(name)) {
    // Handle space-separated event names by delegating them individually.
    for (names = name.split(eventSplitter); i < names.length; i++) {
      events = iteratee(events, names[i], callback, opts);
    }
  } else {
    // Finally, standard events.
    events = iteratee(events, name, callback, opts);
  }
  return events;
};

// Bind an event to a `callback` function. Passing `"all"` will bind
// the callback to all events fired.
Events.on = function (name, callback, context) {
  return internalOn(this, name, callback, context);
};

// Guard the `listening` argument from the public API.
var internalOn = function internalOn(obj, name, callback, context, listening) {
  obj._events = eventsApi(onApi, obj._events || {}, name, callback, {
    context: context,
    ctx: obj,
    listening: listening
  });

  if (listening) {
    var listeners = obj._listeners || (obj._listeners = {});
    listeners[listening.id] = listening;
  }

  return obj;
};

// Inversion-of-control versions of `on`. Tell *this* object to listen to
// an event in another object... keeping track of what it's listening to
// for easier unbinding later.
Events.listenTo = function (obj, name, callback) {
  if (!obj) return this;
  var id = obj._listenId || (obj._listenId = _.uniqueId('l'));
  var listeningTo = this._listeningTo || (this._listeningTo = {});
  var listening = listeningTo[id];

  // This object is not listening to any other events on `obj` yet.
  // Setup the necessary references to track the listening callbacks.
  if (!listening) {
    var thisId = this._listenId || (this._listenId = _.uniqueId('l'));
    listening = listeningTo[id] = {
      obj: obj,
      objId: id,
      id: thisId,
      listeningTo: listeningTo,
      count: 0
    };
  }

  // Bind callbacks on obj, and keep track of them on listening.
  internalOn(obj, name, callback, this, listening);
  return this;
};

// The reducing API that adds a callback to the `events` object.
var onApi = function onApi(events, name, callback, options) {
  if (callback) {
    var handlers = events[name] || (events[name] = []);
    var context = options.context,
        ctx = options.ctx,
        listening = options.listening;
    if (listening) listening.count++;

    handlers.push({
      callback: callback,
      context: context,
      ctx: context || ctx,
      listening: listening
    });
  }
  return events;
};

// Remove one or many callbacks. If `context` is null, removes all
// callbacks with that function. If `callback` is null, removes all
// callbacks for the event. If `name` is null, removes all bound
// callbacks for all events.
Events.off = function (name, callback, context) {
  if (!this._events) return this;
  this._events = eventsApi(offApi, this._events, name, callback, {
    context: context,
    listeners: this._listeners
  });
  return this;
};

// Tell this object to stop listening to either specific events ... or
// to every object it's currently listening to.
Events.stopListening = function (obj, name, callback) {
  var listeningTo = this._listeningTo;
  if (!listeningTo) return this;

  var ids = obj ? [obj._listenId] : _.keys(listeningTo);

  for (var i = 0; i < ids.length; i++) {
    var listening = listeningTo[ids[i]];

    // If listening doesn't exist, this object is not currently
    // listening to obj. Break out early.
    if (!listening) break;

    listening.obj.off(name, callback, this);
  }

  return this;
};

// The reducing API that removes a callback from the `events` object.
var offApi = function offApi(events, name, callback, options) {
  if (!events) return;

  var i = 0,
      listening;
  var context = options.context,
      listeners = options.listeners;

  // Delete all events listeners and "drop" events.
  if (!name && !callback && !context) {
    var ids = _.keys(listeners);
    for (; i < ids.length; i++) {
      listening = listeners[ids[i]];
      delete listeners[listening.id];
      delete listening.listeningTo[listening.objId];
    }
    return;
  }

  var names = name ? [name] : _.keys(events);
  for (; i < names.length; i++) {
    name = names[i];
    var handlers = events[name];

    // Bail out if there are no events stored.
    if (!handlers) break;

    // Replace events if there are any remaining.  Otherwise, clean up.
    var remaining = [];
    for (var j = 0; j < handlers.length; j++) {
      var handler = handlers[j];
      if (callback && callback !== handler.callback && callback !== handler.callback._callback || context && context !== handler.context) {
        remaining.push(handler);
      } else {
        listening = handler.listening;
        if (listening && --listening.count === 0) {
          delete listeners[listening.id];
          delete listening.listeningTo[listening.objId];
        }
      }
    }

    // Update tail event if the list has any events.  Otherwise, clean up.
    if (remaining.length) {
      events[name] = remaining;
    } else {
      delete events[name];
    }
  }
  return events;
};

// Bind an event to only be triggered a single time. After the first time
// the callback is invoked, its listener will be removed. If multiple events
// are passed in using the space-separated syntax, the handler will fire
// once for each event, not once for a combination of all events.
Events.once = function (name, callback, context) {
  // Map the event into a `{event: once}` object.
  var events = eventsApi(onceMap, {}, name, callback, _.bind(this.off, this));
  if (typeof name === 'string' && context == null) callback = void 0;
  return this.on(events, callback, context);
};

// Inversion-of-control versions of `once`.
Events.listenToOnce = function (obj, name, callback) {
  // Map the event into a `{event: once}` object.
  var events = eventsApi(onceMap, {}, name, callback, _.bind(this.stopListening, this, obj));
  return this.listenTo(obj, events);
};

// Reduces the event callbacks into a map of `{event: onceWrapper}`.
// `offer` unbinds the `onceWrapper` after it has been called.
var onceMap = function onceMap(map, name, callback, offer) {
  if (callback) {
    var once = map[name] = _.once(function () {
      offer(name, once);
      callback.apply(this, arguments);
    });
    once._callback = callback;
  }
  return map;
};

// Trigger one or many events, firing all bound callbacks. Callbacks are
// passed the same arguments as `trigger` is, apart from the event name
// (unless you're listening on `"all"`, which will cause your callback to
// receive the true name of the event as the first argument).
Events.trigger = function (name) {
  if (!this._events) return this;

  var length = Math.max(0, arguments.length - 1);
  var args = Array(length);
  for (var i = 0; i < length; i++) {
    args[i] = arguments[i + 1];
  }eventsApi(triggerApi, this._events, name, void 0, args);
  return this;
};

// Handles triggering the appropriate event callbacks.
var triggerApi = function triggerApi(objEvents, name, callback, args) {
  if (objEvents) {
    var events = objEvents[name];
    var allEvents = objEvents.all;
    if (events && allEvents) allEvents = allEvents.slice();
    if (events) triggerEvents(events, args);
    if (allEvents) triggerEvents(allEvents, [name].concat(args));
  }
  return objEvents;
};

// A difficult-to-believe, but optimized internal dispatch function for
// triggering events. Tries to keep the usual cases speedy (most internal
// Backbone events have 3 arguments).
var triggerEvents = function triggerEvents(events, args) {
  var ev,
      i = -1,
      l = events.length,
      a1 = args[0],
      a2 = args[1],
      a3 = args[2];
  switch (args.length) {
    case 0:
      while (++i < l) {
        (ev = events[i]).callback.call(ev.ctx);
      }return;
    case 1:
      while (++i < l) {
        (ev = events[i]).callback.call(ev.ctx, a1);
      }return;
    case 2:
      while (++i < l) {
        (ev = events[i]).callback.call(ev.ctx, a1, a2);
      }return;
    case 3:
      while (++i < l) {
        (ev = events[i]).callback.call(ev.ctx, a1, a2, a3);
      }return;
    default:
      while (++i < l) {
        (ev = events[i]).callback.apply(ev.ctx, args);
      }return;
  }
};

// Aliases for backwards compatibility.
Events.bind = Events.on;
Events.unbind = Events.off;

// Backbone.Model
// --------------

// Backbone **Models** are the basic data object in the framework --
// frequently representing a row in a table in a database on your server.
// A discrete chunk of data and a bunch of useful, related methods for
// performing computations and transformations on that data.

// Create a new model with the specified attributes. A client id (`cid`)
// is automatically generated and assigned for you.
var Model = function Model(attributes, options) {
  var attrs = attributes || {};
  options || (options = {});
  this.preinitialize.apply(this, arguments);
  this.cid = _.uniqueId(this.cidPrefix);
  this.attributes = {};
  if (options.collection) this.collection = options.collection;
  if (options.parse) attrs = this.parse(attrs, options) || {};
  var defaults = _.result(this, 'defaults');
  attrs = _.defaults(_.extend({}, defaults, attrs), defaults);
  this.set(attrs, options);
  this.changed = {};
  this.initialize.apply(this, arguments);
};

// Attach all inheritable methods to the Model prototype.
_.extend(Model.prototype, Events, {

  // A hash of attributes whose current and previous value differ.
  changed: null,

  // The value returned during the last failed validation.
  validationError: null,

  // The default name for the JSON `id` attribute is `"id"`. MongoDB and
  // CouchDB users may want to set this to `"_id"`.
  idAttribute: 'id',

  // The prefix is used to create the client id which is used to identify models locally.
  // You may want to override this if you're experiencing name clashes with model ids.
  cidPrefix: 'c',

  // preinitialize is an empty function by default. You can override it with a function
  // or object.  preinitialize will run before any instantiation logic is run in the Model.
  preinitialize: function preinitialize() {},

  // Initialize is an empty function by default. Override it with your own
  // initialization logic.
  initialize: function initialize() {},

  // Return a copy of the model's `attributes` object.
  toJSON: function toJSON(options) {
    return _.clone(this.attributes);
  },

  // Proxy `Backbone.sync` by default -- but override this if you need
  // custom syncing semantics for *this* particular model.
  sync: function sync$1() {
    return Backbone$1.sync.apply(this, arguments);
  },

  // Get the value of an attribute.
  get: function get(attr) {
    return this.attributes[attr];
  },

  // Get the HTML-escaped value of an attribute.
  escape: function escape(attr) {
    return _.escape(this.get(attr));
  },

  // Returns `true` if the attribute contains a value that is not null
  // or undefined.
  has: function has(attr) {
    return this.get(attr) != null;
  },

  // Special-cased proxy to underscore's `_.matches` method.
  matches: function matches(attrs) {
    return !!_.iteratee(attrs, this)(this.attributes);
  },

  // Set a hash of model attributes on the object, firing `"change"`. This is
  // the core primitive operation of a model, updating the data and notifying
  // anyone who needs to know about the change in state. The heart of the beast.
  set: function set(key, val, options) {
    if (key == null) return this;

    // Handle both `"key", value` and `{key: value}` -style arguments.
    var attrs;
    if (typeof key === 'object') {
      attrs = key;
      options = val;
    } else {
      (attrs = {})[key] = val;
    }

    options || (options = {});

    // Run validation.
    if (!this._validate(attrs, options)) return false;

    // Extract attributes and options.
    var unset = options.unset;
    var silent = options.silent;
    var changes = [];
    var changing = this._changing;
    this._changing = true;

    if (!changing) {
      this._previousAttributes = _.clone(this.attributes);
      this.changed = {};
    }

    var current = this.attributes;
    var changed = this.changed;
    var prev = this._previousAttributes;

    // For each `set` attribute, update or delete the current value.
    for (var attr in attrs) {
      val = attrs[attr];
      if (!_.isEqual(current[attr], val)) changes.push(attr);
      if (!_.isEqual(prev[attr], val)) {
        changed[attr] = val;
      } else {
        delete changed[attr];
      }
      unset ? delete current[attr] : current[attr] = val;
    }

    // Update the `id`.
    if (this.idAttribute in attrs) this.id = this.get(this.idAttribute);

    // Trigger all relevant attribute changes.
    if (!silent) {
      if (changes.length) this._pending = options;
      for (var i = 0; i < changes.length; i++) {
        this.trigger('change:' + changes[i], this, current[changes[i]], options);
      }
    }

    // You might be wondering why there's a `while` loop here. Changes can
    // be recursively nested within `"change"` events.
    if (changing) return this;
    if (!silent) {
      while (this._pending) {
        options = this._pending;
        this._pending = false;
        this.trigger('change', this, options);
      }
    }
    this._pending = false;
    this._changing = false;
    return this;
  },

  // Remove an attribute from the model, firing `"change"`. `unset` is a noop
  // if the attribute doesn't exist.
  unset: function unset(attr, options) {
    return this.set(attr, void 0, _.extend({}, options, {
      unset: true
    }));
  },

  // Clear all attributes on the model, firing `"change"`.
  clear: function clear(options) {
    var attrs = {};
    for (var key in this.attributes) {
      attrs[key] = void 0;
    }return this.set(attrs, _.extend({}, options, {
      unset: true
    }));
  },

  // Determine if the model has changed since the last `"change"` event.
  // If you specify an attribute name, determine if that attribute has changed.
  hasChanged: function hasChanged(attr) {
    if (attr == null) return !_.isEmpty(this.changed);
    return _.has(this.changed, attr);
  },

  // Return an object containing all the attributes that have changed, or
  // false if there are no changed attributes. Useful for determining what
  // parts of a view need to be updated and/or what attributes need to be
  // persisted to the server. Unset attributes will be set to undefined.
  // You can also pass an attributes object to diff against the model,
  // determining if there *would be* a change.
  changedAttributes: function changedAttributes(diff) {
    if (!diff) return this.hasChanged() ? _.clone(this.changed) : false;
    var old = this._changing ? this._previousAttributes : this.attributes;
    var changed = {};
    var hasChanged;
    for (var attr in diff) {
      var val = diff[attr];
      if (_.isEqual(old[attr], val)) continue;
      changed[attr] = val;
      hasChanged = true;
    }
    return hasChanged ? changed : false;
  },

  // Get the previous value of an attribute, recorded at the time the last
  // `"change"` event was fired.
  previous: function previous(attr) {
    if (attr == null || !this._previousAttributes) return null;
    return this._previousAttributes[attr];
  },

  // Get all of the attributes of the model at the time of the previous
  // `"change"` event.
  previousAttributes: function previousAttributes() {
    return _.clone(this._previousAttributes);
  },

  // Fetch the model from the server, merging the response with the model's
  // local attributes. Any changed attributes will trigger a "change" event.
  fetch: function fetch(options) {
    options = _.extend({
      parse: true
    }, options);
    var model = this;
    var success = options.success;
    options.success = function (resp) {
      var serverAttrs = options.parse ? model.parse(resp, options) : resp;
      if (!model.set(serverAttrs, options)) return false;
      if (success) success.call(options.context, model, resp, options);
      model.trigger('sync', model, resp, options);
    };
    wrapError(this, options);
    return this.sync('read', this, options);
  },

  // Set a hash of model attributes, and sync the model to the server.
  // If the server returns an attributes hash that differs, the model's
  // state will be `set` again.
  save: function save(key, val, options) {
    // Handle both `"key", value` and `{key: value}` -style arguments.
    var attrs;
    if (key == null || typeof key === 'object') {
      attrs = key;
      options = val;
    } else {
      (attrs = {})[key] = val;
    }

    options = _.extend({
      validate: true,
      parse: true
    }, options);
    var wait = options.wait;

    // If we're not waiting and attributes exist, save acts as
    // `set(attr).save(null, opts)` with validation. Otherwise, check if
    // the model will be valid when the attributes, if any, are set.
    if (attrs && !wait) {
      if (!this.set(attrs, options)) return false;
    } else if (!this._validate(attrs, options)) {
      return false;
    }

    // After a successful server-side save, the client is (optionally)
    // updated with the server-side state.
    var model = this;
    var success = options.success;
    var attributes = this.attributes;
    options.success = function (resp) {
      // Ensure attributes are restored during synchronous saves.
      model.attributes = attributes;
      var serverAttrs = options.parse ? model.parse(resp, options) : resp;
      if (wait) serverAttrs = _.extend({}, attrs, serverAttrs);
      if (serverAttrs && !model.set(serverAttrs, options)) return false;
      if (success) success.call(options.context, model, resp, options);
      model.trigger('sync', model, resp, options);
    };
    wrapError(this, options);

    // Set temporary attributes if `{wait: true}` to properly find new ids.
    if (attrs && wait) this.attributes = _.extend({}, attributes, attrs);

    var method = this.isNew() ? 'create' : options.patch ? 'patch' : 'update';
    if (method === 'patch' && !options.attrs) options.attrs = attrs;
    var xhr = this.sync(method, this, options);

    // Restore attributes.
    this.attributes = attributes;

    return xhr;
  },

  // Destroy this model on the server if it was already persisted.
  // Optimistically removes the model from its collection, if it has one.
  // If `wait: true` is passed, waits for the server to respond before removal.
  destroy: function destroy(options) {
    options = options ? _.clone(options) : {};
    var model = this;
    var success = options.success;
    var wait = options.wait;

    var destroy = function destroy() {
      model.stopListening();
      model.trigger('destroy', model, model.collection, options);
    };

    options.success = function (resp) {
      if (wait) destroy();
      if (success) success.call(options.context, model, resp, options);
      if (!model.isNew()) model.trigger('sync', model, resp, options);
    };

    var xhr = false;
    if (this.isNew()) {
      _.defer(options.success);
    } else {
      wrapError(this, options);
      xhr = this.sync('delete', this, options);
    }
    if (!wait) destroy();
    return xhr;
  },

  // Default URL for the model's representation on the server -- if you're
  // using Backbone's restful methods, override this to change the endpoint
  // that will be called.
  url: function url() {
    var base = _.result(this, 'urlRoot') || _.result(this.collection, 'url') || urlError();
    if (this.isNew()) return base;
    var id = this.get(this.idAttribute);
    return base.replace(/[^\/]$/, '$&/') + encodeURIComponent(id);
  },

  // **parse** converts a response into the hash of attributes to be `set` on
  // the model. The default implementation is just to pass the response along.
  parse: function parse(resp, options) {
    return resp;
  },

  // Create a new model with identical attributes to this one.
  clone: function clone() {
    return new this.constructor(this.attributes);
  },

  // A model is new if it has never been saved to the server, and lacks an id.
  isNew: function isNew() {
    return !this.has(this.idAttribute);
  },

  // Check if the model is currently in a valid state.
  isValid: function isValid(options) {
    return this._validate({}, _.extend({}, options, {
      validate: true
    }));
  },

  // Run validation against the next complete set of model attributes,
  // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
  _validate: function _validate(attrs, options) {
    if (!options.validate || !this.validate) return true;
    attrs = _.extend({}, this.attributes, attrs);
    var error = this.validationError = this.validate(attrs, options) || null;
    if (!error) return true;
    this.trigger('invalid', this, error, _.extend(options, {
      validationError: error
    }));
    return false;
  }

});

// Underscore methods that we want to implement on the Model, mapped to the
// number of arguments they take.
var modelMethods = {
  keys: 1,
  values: 1,
  pairs: 1,
  invert: 1,
  pick: 0,
  omit: 0,
  chain: 1,
  isEmpty: 1
};

// Mix in each Underscore method as a proxy to `Model#attributes`.
addUnderscoreMethods(Model, modelMethods, 'attributes');

// Create a local reference to a common array method we'll want to use later.
var slice$1 = Array.prototype.slice;

// Backbone.Collection
// -------------------

// If models tend to represent a single row of data, a Backbone Collection is
// more analogous to a table full of data ... or a small slice or page of that
// table, or a collection of rows that belong together for a particular reason
// -- all of the messages in this particular folder, all of the documents
// belonging to this particular author, and so on. Collections maintain
// indexes of their models, both in order, and for lookup by `id`.

// Create a new **Collection**, perhaps to contain a specific type of `model`.
// If a `comparator` is specified, the Collection will maintain
// its models in sort order, as they're added and removed.
var Collection = function Collection(models, options) {
  options || (options = {});
  this.preinitialize.apply(this, arguments);
  if (options.model) this.model = options.model;
  if (options.comparator !== void 0) this.comparator = options.comparator;
  this._reset();
  this.initialize.apply(this, arguments);
  if (models) this.reset(models, _.extend({
    silent: true
  }, options));
};

// Default options for `Collection#set`.
var setOptions$1 = {
  add: true,
  remove: true,
  merge: true
};
var addOptions = {
  add: true,
  remove: false
};

// Splices `insert` into `array` at index `at`.
var splice = function splice(array, insert, at) {
  at = Math.min(Math.max(at, 0), array.length);
  var tail = Array(array.length - at);
  var length = insert.length;
  var i;
  for (i = 0; i < tail.length; i++) {
    tail[i] = array[i + at];
  }for (i = 0; i < length; i++) {
    array[i + at] = insert[i];
  }for (i = 0; i < tail.length; i++) {
    array[i + length + at] = tail[i];
  }
};

// Define the Collection's inheritable methods.
_.extend(Collection.prototype, Events, {

  // The default model for a collection is just a **Backbone.Model**.
  // This should be overridden in most cases.
  model: Model,

  // preinitialize is an empty function by default. You can override it with a function
  // or object.  preinitialize will run before any instantiation logic is run in the Collection.
  preinitialize: function preinitialize() {},

  // Initialize is an empty function by default. Override it with your own
  // initialization logic.
  initialize: function initialize() {},

  // The JSON representation of a Collection is an array of the
  // models' attributes.
  toJSON: function toJSON(options) {
    return this.map(function (model) {
      return model.toJSON(options);
    });
  },

  // Proxy `Backbone.sync` by default.
  sync: function sync$1() {
    return Backbone$1.sync.apply(this, arguments);
  },

  // Add a model, or list of models to the set. `models` may be Backbone
  // Models or raw JavaScript objects to be converted to Models, or any
  // combination of the two.
  add: function add(models, options) {
    return this.set(models, _.extend({
      merge: false
    }, options, addOptions));
  },

  // Remove a model, or a list of models from the set.
  remove: function remove(models, options) {
    options = _.extend({}, options);
    var singular = !_.isArray(models);
    models = singular ? [models] : models.slice();
    var removed = this._removeModels(models, options);
    if (!options.silent && removed.length) {
      options.changes = {
        added: [],
        merged: [],
        removed: removed
      };
      this.trigger('update', this, options);
    }
    return singular ? removed[0] : removed;
  },

  // Update a collection by `set`-ing a new list of models, adding new ones,
  // removing models that are no longer present, and merging models that
  // already exist in the collection, as necessary. Similar to **Model#set**,
  // the core operation for updating the data contained by the collection.
  set: function set(models, options) {
    if (models == null) return;

    options = _.extend({}, setOptions$1, options);
    if (options.parse && !this._isModel(models)) {
      models = this.parse(models, options) || [];
    }

    var singular = !_.isArray(models);
    models = singular ? [models] : models.slice();

    var at = options.at;
    if (at != null) at = +at;
    if (at > this.length) at = this.length;
    if (at < 0) at += this.length + 1;

    var set = [];
    var toAdd = [];
    var toMerge = [];
    var toRemove = [];
    var modelMap = {};

    var add = options.add;
    var merge = options.merge;
    var remove = options.remove;

    var sort = false;
    var sortable = this.comparator && at == null && options.sort !== false;
    var sortAttr = _.isString(this.comparator) ? this.comparator : null;

    // Turn bare objects into model references, and prevent invalid models
    // from being added.
    var model, i;
    for (i = 0; i < models.length; i++) {
      model = models[i];

      // If a duplicate is found, prevent it from being added and
      // optionally merge it into the existing model.
      var existing = this.get(model);
      if (existing) {
        if (merge && model !== existing) {
          var attrs = this._isModel(model) ? model.attributes : model;
          if (options.parse) attrs = existing.parse(attrs, options);
          existing.set(attrs, options);
          toMerge.push(existing);
          if (sortable && !sort) sort = existing.hasChanged(sortAttr);
        }
        if (!modelMap[existing.cid]) {
          modelMap[existing.cid] = true;
          set.push(existing);
        }
        models[i] = existing;

        // If this is a new, valid model, push it to the `toAdd` list.
      } else if (add) {
        model = models[i] = this._prepareModel(model, options);
        if (model) {
          toAdd.push(model);
          this._addReference(model, options);
          modelMap[model.cid] = true;
          set.push(model);
        }
      }
    }

    // Remove stale models.
    if (remove) {
      for (i = 0; i < this.length; i++) {
        model = this.models[i];
        if (!modelMap[model.cid]) toRemove.push(model);
      }
      if (toRemove.length) this._removeModels(toRemove, options);
    }

    // See if sorting is needed, update `length` and splice in new models.
    var orderChanged = false;
    var replace = !sortable && add && remove;
    if (set.length && replace) {
      orderChanged = this.length !== set.length || _.some(this.models, function (m, index) {
        return m !== set[index];
      });
      this.models.length = 0;
      splice(this.models, set, 0);
      this.length = this.models.length;
    } else if (toAdd.length) {
      if (sortable) sort = true;
      splice(this.models, toAdd, at == null ? this.length : at);
      this.length = this.models.length;
    }

    // Silently sort the collection if appropriate.
    if (sort) this.sort({
      silent: true
    });

    // Unless silenced, it's time to fire all appropriate add/sort/update events.
    if (!options.silent) {
      for (i = 0; i < toAdd.length; i++) {
        if (at != null) options.index = at + i;
        model = toAdd[i];
        model.trigger('add', model, this, options);
      }
      if (sort || orderChanged) this.trigger('sort', this, options);
      if (toAdd.length || toRemove.length || toMerge.length) {
        options.changes = {
          added: toAdd,
          removed: toRemove,
          merged: toMerge
        };
        this.trigger('update', this, options);
      }
    }

    // Return the added (or merged) model (or models).
    return singular ? models[0] : models;
  },

  // When you have more items than you want to add or remove individually,
  // you can reset the entire set with a new list of models, without firing
  // any granular `add` or `remove` events. Fires `reset` when finished.
  // Useful for bulk operations and optimizations.
  reset: function reset(models, options) {
    options = options ? _.clone(options) : {};
    for (var i = 0; i < this.models.length; i++) {
      this._removeReference(this.models[i], options);
    }
    options.previousModels = this.models;
    this._reset();
    models = this.add(models, _.extend({
      silent: true
    }, options));
    if (!options.silent) this.trigger('reset', this, options);
    return models;
  },

  // Add a model to the end of the collection.
  push: function push(model, options) {
    return this.add(model, _.extend({
      at: this.length
    }, options));
  },

  // Remove a model from the end of the collection.
  pop: function pop(options) {
    var model = this.at(this.length - 1);
    return this.remove(model, options);
  },

  // Add a model to the beginning of the collection.
  unshift: function unshift(model, options) {
    return this.add(model, _.extend({
      at: 0
    }, options));
  },

  // Remove a model from the beginning of the collection.
  shift: function shift(options) {
    var model = this.at(0);
    return this.remove(model, options);
  },

  // Slice out a sub-array of models from the collection.
  slice: function slice() {
    return slice$1.apply(this.models, arguments);
  },

  // Get a model from the set by id, cid, model object with id or cid
  // properties, or an attributes object that is transformed through modelId.
  get: function get(obj) {
    if (obj == null) return void 0;
    return this._byId[obj] || this._byId[this.modelId(obj.attributes || obj)] || obj.cid && this._byId[obj.cid];
  },

  // Returns `true` if the model is in the collection.
  has: function has(obj) {
    return this.get(obj) != null;
  },

  // Get the model at the given index.
  at: function at(index) {
    if (index < 0) index += this.length;
    return this.models[index];
  },

  // Return models with matching attributes. Useful for simple cases of
  // `filter`.
  where: function where(attrs, first) {
    return this[first ? 'find' : 'filter'](attrs);
  },

  // Return the first model with matching attributes. Useful for simple cases
  // of `find`.
  findWhere: function findWhere(attrs) {
    return this.where(attrs, true);
  },

  // Force the collection to re-sort itself. You don't need to call this under
  // normal circumstances, as the set will maintain sort order as each item
  // is added.
  sort: function sort(options) {
    var comparator = this.comparator;
    if (!comparator) throw new Error('Cannot sort a set without a comparator');
    options || (options = {});

    var length = comparator.length;
    if (_.isFunction(comparator)) comparator = _.bind(comparator, this);

    // Run sort based on type of `comparator`.
    if (length === 1 || _.isString(comparator)) {
      this.models = this.sortBy(comparator);
    } else {
      this.models.sort(comparator);
    }
    if (!options.silent) this.trigger('sort', this, options);
    return this;
  },

  // Pluck an attribute from each model in the collection.
  pluck: function pluck(attr) {
    return this.map(attr + '');
  },

  // Fetch the default set of models for this collection, resetting the
  // collection when they arrive. If `reset: true` is passed, the response
  // data will be passed through the `reset` method instead of `set`.
  fetch: function fetch(options) {
    options = _.extend({
      parse: true
    }, options);
    var success = options.success;
    var collection = this;
    options.success = function (resp) {
      var method = options.reset ? 'reset' : 'set';
      collection[method](resp, options);
      if (success) success.call(options.context, collection, resp, options);
      collection.trigger('sync', collection, resp, options);
    };
    wrapError(this, options);
    return this.sync('read', this, options);
  },

  // Create a new instance of a model in this collection. Add the model to the
  // collection immediately, unless `wait: true` is passed, in which case we
  // wait for the server to agree.
  create: function create(model, options) {
    options = options ? _.clone(options) : {};
    var wait = options.wait;
    model = this._prepareModel(model, options);
    if (!model) return false;
    if (!wait) this.add(model, options);
    var collection = this;
    var success = options.success;
    options.success = function (m, resp, callbackOpts) {
      if (wait) collection.add(m, callbackOpts);
      if (success) success.call(callbackOpts.context, m, resp, callbackOpts);
    };
    model.save(null, options);
    return model;
  },

  // **parse** converts a response into a list of models to be added to the
  // collection. The default implementation is just to pass it through.
  parse: function parse(resp, options) {
    return resp;
  },

  // Create a new collection with an identical list of models as this one.
  clone: function clone() {
    return new this.constructor(this.models, {
      model: this.model,
      comparator: this.comparator
    });
  },

  // Define how to uniquely identify models in the collection.
  modelId: function modelId(attrs) {
    return attrs[this.model.prototype.idAttribute || 'id'];
  },

  // Private method to reset all internal state. Called when the collection
  // is first initialized or reset.
  _reset: function _reset() {
    this.length = 0;
    this.models = [];
    this._byId = {};
  },

  // Prepare a hash of attributes (or other model) to be added to this
  // collection.
  _prepareModel: function _prepareModel(attrs, options) {
    if (this._isModel(attrs)) {
      if (!attrs.collection) attrs.collection = this;
      return attrs;
    }
    options = options ? _.clone(options) : {};
    options.collection = this;
    var model = new this.model(attrs, options);
    if (!model.validationError) return model;
    this.trigger('invalid', this, model.validationError, options);
    return false;
  },

  // Internal method called by both remove and set.
  _removeModels: function _removeModels(models, options) {
    var removed = [];
    for (var i = 0; i < models.length; i++) {
      var model = this.get(models[i]);
      if (!model) continue;

      var index = this.indexOf(model);
      this.models.splice(index, 1);
      this.length--;

      // Remove references before triggering 'remove' event to prevent an
      // infinite loop. #3693
      delete this._byId[model.cid];
      var id = this.modelId(model.attributes);
      if (id != null) delete this._byId[id];

      if (!options.silent) {
        options.index = index;
        model.trigger('remove', model, this, options);
      }

      removed.push(model);
      this._removeReference(model, options);
    }
    return removed;
  },

  // Method for checking whether an object should be considered a model for
  // the purposes of adding to the collection.
  _isModel: function _isModel(model) {
    return model instanceof Model;
  },

  // Internal method to create a model's ties to a collection.
  _addReference: function _addReference(model, options) {
    this._byId[model.cid] = model;
    var id = this.modelId(model.attributes);
    if (id != null) this._byId[id] = model;
    model.on('all', this._onModelEvent, this);
  },

  // Internal method to sever a model's ties to a collection.
  _removeReference: function _removeReference(model, options) {
    delete this._byId[model.cid];
    var id = this.modelId(model.attributes);
    if (id != null) delete this._byId[id];
    if (this === model.collection) delete model.collection;
    model.off('all', this._onModelEvent, this);
  },

  // Internal method called every time a model in the set fires an event.
  // Sets need to update their indexes when models change ids. All other
  // events simply proxy through. "add" and "remove" events that originate
  // in other collections are ignored.
  _onModelEvent: function _onModelEvent(event, model, collection, options) {
    if (model) {
      if ((event === 'add' || event === 'remove') && collection !== this) return;
      if (event === 'destroy') this.remove(model, options);
      if (event === 'change') {
        var prevId = this.modelId(model.previousAttributes());
        var id = this.modelId(model.attributes);
        if (prevId !== id) {
          if (prevId != null) delete this._byId[prevId];
          if (id != null) this._byId[id] = model;
        }
      }
    }
    this.trigger.apply(this, arguments);
  }

});

// Underscore methods that we want to implement on the Collection.
// 90% of the core usefulness of Backbone Collections is actually implemented
// right here:
var collectionMethods = {
  forEach: 3,
  each: 3,
  map: 3,
  collect: 3,
  reduce: 0,
  foldl: 0,
  inject: 0,
  reduceRight: 0,
  foldr: 0,
  find: 3,
  detect: 3,
  filter: 3,
  select: 3,
  reject: 3,
  every: 3,
  all: 3,
  some: 3,
  any: 3,
  include: 3,
  includes: 3,
  contains: 3,
  invoke: 0,
  max: 3,
  min: 3,
  toArray: 1,
  size: 1,
  first: 3,
  head: 3,
  take: 3,
  initial: 3,
  rest: 3,
  tail: 3,
  drop: 3,
  last: 3,
  without: 0,
  difference: 0,
  indexOf: 3,
  shuffle: 1,
  lastIndexOf: 3,
  isEmpty: 1,
  chain: 1,
  sample: 3,
  partition: 3,
  groupBy: 3,
  countBy: 3,
  sortBy: 3,
  indexBy: 3,
  findIndex: 3,
  findLastIndex: 3
};

// Mix in each Underscore method as a proxy to `Collection#models`.
addUnderscoreMethods(Collection, collectionMethods, 'models');

// Backbone.View
// -------------

// Backbone Views are almost more convention than they are actual code. A View
// is simply a JavaScript object that represents a logical chunk of UI in the
// DOM. This might be a single item, an entire list, a sidebar or panel, or
// even the surrounding frame which wraps your whole app. Defining a chunk of
// UI as a **View** allows you to define your DOM events declaratively, without
// having to worry about render order ... and makes it easy for the view to
// react to specific changes in the state of your models.

// Creating a Backbone.View creates its initial element outside of the DOM,
// if an existing element is not provided...
var View = function View(options) {
  this.cid = _.uniqueId('view');
  this.preinitialize.apply(this, arguments);
  _.extend(this, _.pick(options, viewOptions));
  this._ensureElement();
  this.initialize.apply(this, arguments);
};

// Cached regex to split keys for `delegate`.
var delegateEventSplitter = /^(\S+)\s*(.*)$/;

// List of view options to be set as properties.
var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

// Set up all inheritable **Backbone.View** properties and methods.
_.extend(View.prototype, Events, {

  // The default `tagName` of a View's element is `"div"`.
  tagName: 'div',

  // jQuery delegate for element lookup, scoped to DOM elements within the
  // current view. This should be preferred to global lookups where possible.
  $: function $(selector) {
    return this.$el.find(selector);
  },

  // preinitialize is an empty function by default. You can override it with a function
  // or object.  preinitialize will run before any instantiation logic is run in the View
  preinitialize: function preinitialize() {},

  // Initialize is an empty function by default. Override it with your own
  // initialization logic.
  initialize: function initialize() {},

  // **render** is the core function that your view should override, in order
  // to populate its element (`this.el`), with the appropriate HTML. The
  // convention is for **render** to always return `this`.
  render: function render() {
    return this;
  },

  // Remove this view by taking the element out of the DOM, and removing any
  // applicable Backbone.Events listeners.
  remove: function remove() {
    this._removeElement();
    this.stopListening();
    return this;
  },

  // Remove this view's element from the document and all event listeners
  // attached to it. Exposed for subclasses using an alternative DOM
  // manipulation API.
  _removeElement: function _removeElement() {
    this.$el.remove();
  },

  // Change the view's element (`this.el` property) and re-delegate the
  // view's events on the new element.
  setElement: function setElement(element) {
    this.undelegateEvents();
    this._setElement(element);
    this.delegateEvents();
    return this;
  },

  // Creates the `this.el` and `this.$el` references for this view using the
  // given `el`. `el` can be a CSS selector or an HTML string, a jQuery
  // context or an element. Subclasses can override this to utilize an
  // alternative DOM manipulation API and are only required to set the
  // `this.el` property.
  _setElement: function _setElement(el) {
    this.$el = el instanceof Backbone$1.$ ? el : Backbone$1.$(el);
    this.el = this.$el[0];
  },

  // Set callbacks, where `this.events` is a hash of
  //
  // *{"event selector": "callback"}*
  //
  //     {
  //       'mousedown .title':  'edit',
  //       'click .button':     'save',
  //       'click .open':       function(e) { ... }
  //     }
  //
  // pairs. Callbacks will be bound to the view, with `this` set properly.
  // Uses event delegation for efficiency.
  // Omitting the selector binds the event to `this.el`.
  delegateEvents: function delegateEvents(events) {
    events || (events = _.result(this, 'events'));
    if (!events) return this;
    this.undelegateEvents();
    for (var key in events) {
      var method = events[key];
      if (!_.isFunction(method)) method = this[method];
      if (!method) continue;
      var match = key.match(delegateEventSplitter);
      this.delegate(match[1], match[2], _.bind(method, this));
    }
    return this;
  },

  // Add a single event listener to the view's element (or a child element
  // using `selector`). This only works for delegate-able events: not `focus`,
  // `blur`, and not `change`, `submit`, and `reset` in Internet Explorer.
  delegate: function delegate(eventName, selector, listener) {
    this.$el.on(eventName + '.delegateEvents' + this.cid, selector, listener);
    return this;
  },

  // Clears all callbacks previously bound to the view by `delegateEvents`.
  // You usually don't need to use this, but may wish to if you have multiple
  // Backbone views attached to the same DOM element.
  undelegateEvents: function undelegateEvents() {
    if (this.$el) this.$el.off('.delegateEvents' + this.cid);
    return this;
  },

  // A finer-grained `undelegateEvents` for removing a single delegated event.
  // `selector` and `listener` are both optional.
  undelegate: function undelegate(eventName, selector, listener) {
    this.$el.off(eventName + '.delegateEvents' + this.cid, selector, listener);
    return this;
  },

  // Produces a DOM element to be assigned to your view. Exposed for
  // subclasses using an alternative DOM manipulation API.
  _createElement: function _createElement(tagName) {
    return document.createElement(tagName);
  },

  // Ensure that the View has a DOM element to render into.
  // If `this.el` is a string, pass it through `$()`, take the first
  // matching element, and re-assign it to `el`. Otherwise, create
  // an element from the `id`, `className` and `tagName` properties.
  _ensureElement: function _ensureElement() {
    if (!this.el) {
      var attrs = _.extend({}, _.result(this, 'attributes'));
      if (this.id) attrs.id = _.result(this, 'id');
      if (this.className) attrs['class'] = _.result(this, 'className');
      this.setElement(this._createElement(_.result(this, 'tagName')));
      this._setAttributes(attrs);
    } else {
      this.setElement(_.result(this, 'el'));
    }
  },

  // Set attributes from a hash on this view's element.  Exposed for
  // subclasses using an alternative DOM manipulation API.
  _setAttributes: function _setAttributes(attributes) {
    this.$el.attr(attributes);
  }

});

// Backbone.Router
// ---------------

// Routers map faux-URLs to actions, and fire events when routes are
// matched. Creating a new one sets its `routes` hash, if not set statically.
var Router = function Router(options) {
  options || (options = {});
  this.preinitialize.apply(this, arguments);
  if (options.routes) this.routes = options.routes;
  this._bindRoutes();
  this.initialize.apply(this, arguments);
};

// Cached regular expressions for matching named param parts and splatted
// parts of route strings.
var optionalParam = /\((.*?)\)/g;
var namedParam = /(\(\?)?:\w+/g;
var splatParam = /\*\w+/g;
var escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;

// Set up all inheritable **Backbone.Router** properties and methods.
_.extend(Router.prototype, Events, {

  // preinitialize is an empty function by default. You can override it with a function
  // or object.  preinitialize will run before any instantiation logic is run in the Router.
  preinitialize: function preinitialize() {},

  // Initialize is an empty function by default. Override it with your own
  // initialization logic.
  initialize: function initialize() {},

  // Manually bind a single named route to a callback. For example:
  //
  //     this.route('search/:query/p:num', 'search', function(query, num) {
  //       ...
  //     });
  //
  route: function route(_route, name, callback) {
    if (!_.isRegExp(_route)) _route = this._routeToRegExp(_route);
    if (_.isFunction(name)) {
      callback = name;
      name = '';
    }
    if (!callback) callback = this[name];
    var router = this;
    Backbone$1.history.route(_route, function (fragment) {
      var args = router._extractParameters(_route, fragment);
      if (router.execute(callback, args, name) !== false) {
        router.trigger.apply(router, ['route:' + name].concat(args));
        router.trigger('route', name, args);
        Backbone$1.history.trigger('route', router, name, args);
      }
    });
    return this;
  },

  // Execute a route handler with the provided parameters.  This is an
  // excellent place to do pre-route setup or post-route cleanup.
  execute: function execute(callback, args, name) {
    if (callback) callback.apply(this, args);
  },

  // Simple proxy to `Backbone.history` to save a fragment into the history.
  navigate: function navigate(fragment, options) {
    Backbone$1.history.navigate(fragment, options);
    return this;
  },

  // Bind all defined routes to `Backbone.history`. We have to reverse the
  // order of the routes here to support behavior where the most general
  // routes can be defined at the bottom of the route map.
  _bindRoutes: function _bindRoutes() {
    if (!this.routes) return;
    this.routes = _.result(this, 'routes');
    var route,
        routes = _.keys(this.routes);
    while ((route = routes.pop()) != null) {
      this.route(route, this.routes[route]);
    }
  },

  // Convert a route string into a regular expression, suitable for matching
  // against the current location hash.
  _routeToRegExp: function _routeToRegExp(route) {
    route = route.replace(escapeRegExp, '\\$&').replace(optionalParam, '(?:$1)?').replace(namedParam, function (match, optional) {
      return optional ? match : '([^/?]+)';
    }).replace(splatParam, '([^?]*?)');
    return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
  },

  // Given a route, and a URL fragment that it matches, return the array of
  // extracted decoded parameters. Empty or unmatched parameters will be
  // treated as `null` to normalize cross-browser behavior.
  _extractParameters: function _extractParameters(route, fragment) {
    var params = route.exec(fragment).slice(1);
    return _.map(params, function (param, i) {
      // Don't decode the search params.
      if (i === params.length - 1) return param || null;
      return param ? decodeURIComponent(param) : null;
    });
  }

});

// Backbone.History
// ----------------

// Handles cross-browser history management, based on either
// [pushState](http://diveintohtml5.info/history.html) and real URLs, or
// [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
// and URL fragments. If the browser supports neither (old IE, natch),
// falls back to polling.
var History = function History() {
  this.handlers = [];
  this.checkUrl = _.bind(this.checkUrl, this);

  // Ensure that `History` can be used outside of the browser.
  if (typeof window !== 'undefined') {
    this.location = window.location;
    this.history = window.history;
  }
};

// Cached regex for stripping a leading hash/slash and trailing space.
var routeStripper = /^[#\/]|\s+$/g;

// Cached regex for stripping leading and trailing slashes.
var rootStripper = /^\/+|\/+$/g;

// Cached regex for stripping urls of hash.
var pathStripper = /#.*$/;

// Has the history handling already been started?
History.started = false;

// Set up all inheritable **Backbone.History** properties and methods.
_.extend(History.prototype, Events, {

  // The default interval to poll for hash changes, if necessary, is
  // twenty times a second.
  interval: 50,

  // Are we at the app root?
  atRoot: function atRoot() {
    var path = this.location.pathname.replace(/[^\/]$/, '$&/');
    return path === this.root && !this.getSearch();
  },

  // Does the pathname match the root?
  matchRoot: function matchRoot() {
    var path = this.decodeFragment(this.location.pathname);
    var rootPath = path.slice(0, this.root.length - 1) + '/';
    return rootPath === this.root;
  },

  // Unicode characters in `location.pathname` are percent encoded so they're
  // decoded for comparison. `%25` should not be decoded since it may be part
  // of an encoded parameter.
  decodeFragment: function decodeFragment(fragment) {
    return decodeURI(fragment.replace(/%25/g, '%2525'));
  },

  // In IE6, the hash fragment and search params are incorrect if the
  // fragment contains `?`.
  getSearch: function getSearch() {
    var match = this.location.href.replace(/#.*/, '').match(/\?.+/);
    return match ? match[0] : '';
  },

  // Gets the true hash value. Cannot use location.hash directly due to bug
  // in Firefox where location.hash will always be decoded.
  getHash: function getHash(window) {
    var match = (window || this).location.href.match(/#(.*)$/);
    return match ? match[1] : '';
  },

  // Get the pathname and search params, without the root.
  getPath: function getPath() {
    var path = this.decodeFragment(this.location.pathname + this.getSearch()).slice(this.root.length - 1);
    return path.charAt(0) === '/' ? path.slice(1) : path;
  },

  // Get the cross-browser normalized URL fragment from the path or hash.
  getFragment: function getFragment(fragment) {
    if (fragment == null) {
      if (this._usePushState || !this._wantsHashChange) {
        fragment = this.getPath();
      } else {
        fragment = this.getHash();
      }
    }
    return fragment.replace(routeStripper, '');
  },

  // Start the hash change handling, returning `true` if the current URL matches
  // an existing route, and `false` otherwise.
  start: function start(options) {
    if (History.started) throw new Error('Backbone.history has already been started');
    History.started = true;

    // Figure out the initial configuration. Do we need an iframe?
    // Is pushState desired ... is it available?
    this.options = _.extend({
      root: '/'
    }, this.options, options);
    this.root = this.options.root;
    this._wantsHashChange = this.options.hashChange !== false;
    this._hasHashChange = 'onhashchange' in window && (document.documentMode === void 0 || document.documentMode > 7);
    this._useHashChange = this._wantsHashChange && this._hasHashChange;
    this._wantsPushState = !!this.options.pushState;
    this._hasPushState = !!(this.history && this.history.pushState);
    this._usePushState = this._wantsPushState && this._hasPushState;
    this.fragment = this.getFragment();

    // Normalize root to always include a leading and trailing slash.
    this.root = ('/' + this.root + '/').replace(rootStripper, '/');

    // Transition from hashChange to pushState or vice versa if both are
    // requested.
    if (this._wantsHashChange && this._wantsPushState) {

      // If we've started off with a route from a `pushState`-enabled
      // browser, but we're currently in a browser that doesn't support it...
      if (!this._hasPushState && !this.atRoot()) {
        var rootPath = this.root.slice(0, -1) || '/';
        this.location.replace(rootPath + '#' + this.getPath());
        // Return immediately as browser will do redirect to new url
        return true;

        // Or if we've started out with a hash-based route, but we're currently
        // in a browser where it could be `pushState`-based instead...
      } else if (this._hasPushState && this.atRoot()) {
        this.navigate(this.getHash(), {
          replace: true
        });
      }
    }

    // Proxy an iframe to handle location events if the browser doesn't
    // support the `hashchange` event, HTML5 history, or the user wants
    // `hashChange` but not `pushState`.
    if (!this._hasHashChange && this._wantsHashChange && !this._usePushState) {
      this.iframe = document.createElement('iframe');
      this.iframe.src = 'javascript:0';
      this.iframe.style.display = 'none';
      this.iframe.tabIndex = -1;
      var body = document.body;
      // Using `appendChild` will throw on IE < 9 if the document is not ready.
      var iWindow = body.insertBefore(this.iframe, body.firstChild).contentWindow;
      iWindow.document.open();
      iWindow.document.close();
      iWindow.location.hash = '#' + this.fragment;
    }

    // Add a cross-platform `addEventListener` shim for older browsers.
    var addEventListener = window.addEventListener || function (eventName, listener) {
      return attachEvent('on' + eventName, listener);
    };

    // Depending on whether we're using pushState or hashes, and whether
    // 'onhashchange' is supported, determine how we check the URL state.
    if (this._usePushState) {
      addEventListener('popstate', this.checkUrl, false);
    } else if (this._useHashChange && !this.iframe) {
      addEventListener('hashchange', this.checkUrl, false);
    } else if (this._wantsHashChange) {
      this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
    }

    if (!this.options.silent) return this.loadUrl();
  },

  // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
  // but possibly useful for unit testing Routers.
  stop: function stop() {
    // Add a cross-platform `removeEventListener` shim for older browsers.
    var removeEventListener = window.removeEventListener || function (eventName, listener) {
      return detachEvent('on' + eventName, listener);
    };

    // Remove window listeners.
    if (this._usePushState) {
      removeEventListener('popstate', this.checkUrl, false);
    } else if (this._useHashChange && !this.iframe) {
      removeEventListener('hashchange', this.checkUrl, false);
    }

    // Clean up the iframe if necessary.
    if (this.iframe) {
      document.body.removeChild(this.iframe);
      this.iframe = null;
    }

    // Some environments will throw when clearing an undefined interval.
    if (this._checkUrlInterval) clearInterval(this._checkUrlInterval);
    History.started = false;
  },

  // Add a route to be tested when the fragment changes. Routes added later
  // may override previous routes.
  route: function route(_route2, callback) {
    this.handlers.unshift({
      route: _route2,
      callback: callback
    });
  },

  // Checks the current URL to see if it has changed, and if it has,
  // calls `loadUrl`, normalizing across the hidden iframe.
  checkUrl: function checkUrl(e) {
    var current = this.getFragment();

    // If the user pressed the back button, the iframe's hash will have
    // changed and we should use that for comparison.
    if (current === this.fragment && this.iframe) {
      current = this.getHash(this.iframe.contentWindow);
    }

    if (current === this.fragment) return false;
    if (this.iframe) this.navigate(current);
    this.loadUrl();
  },

  // Attempt to load the current URL fragment. If a route succeeds with a
  // match, returns `true`. If no defined routes matches the fragment,
  // returns `false`.
  loadUrl: function loadUrl(fragment) {
    // If the root doesn't match, no routes can match either.
    if (!this.matchRoot()) return false;
    fragment = this.fragment = this.getFragment(fragment);
    return _.some(this.handlers, function (handler) {
      if (handler.route.test(fragment)) {
        handler.callback(fragment);
        return true;
      }
    });
  },

  // Save a fragment into the hash history, or replace the URL state if the
  // 'replace' option is passed. You are responsible for properly URL-encoding
  // the fragment in advance.
  //
  // The options object can contain `trigger: true` if you wish to have the
  // route callback be fired (not usually desirable), or `replace: true`, if
  // you wish to modify the current URL without adding an entry to the history.
  navigate: function navigate(fragment, options) {
    if (!History.started) return false;
    if (!options || options === true) options = {
      trigger: !!options
    };

    // Normalize the fragment.
    fragment = this.getFragment(fragment || '');

    // Don't include a trailing slash on the root.
    var rootPath = this.root;
    if (fragment === '' || fragment.charAt(0) === '?') {
      rootPath = rootPath.slice(0, -1) || '/';
    }
    var url = rootPath + fragment;

    // Strip the fragment of the query and hash for matching.
    fragment = fragment.replace(pathStripper, '');

    // Decode for matching.
    var decodedFragment = this.decodeFragment(fragment);

    if (this.fragment === decodedFragment) return;
    this.fragment = decodedFragment;

    // If pushState is available, we use it to set the fragment as a real URL.
    if (this._usePushState) {
      this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

      // If hash changes haven't been explicitly disabled, update the hash
      // fragment to store history.
    } else if (this._wantsHashChange) {
      this._updateHash(this.location, fragment, options.replace);
      if (this.iframe && fragment !== this.getHash(this.iframe.contentWindow)) {
        var iWindow = this.iframe.contentWindow;

        // Opening and closing the iframe tricks IE7 and earlier to push a
        // history entry on hash-tag change.  When replace is true, we don't
        // want this.
        if (!options.replace) {
          iWindow.document.open();
          iWindow.document.close();
        }

        this._updateHash(iWindow.location, fragment, options.replace);
      }

      // If you've told us that you explicitly don't want fallback hashchange-
      // based history, then `navigate` becomes a page refresh.
    } else {
      return this.location.assign(url);
    }
    if (options.trigger) return this.loadUrl(fragment);
  },

  // Update the hash location, either replacing the current entry, or adding
  // a new one to the browser history.
  _updateHash: function _updateHash(location, fragment, replace) {
    if (replace) {
      var href = location.href.replace(/(javascript:|#).*$/, '');
      location.replace(href + '#' + fragment);
    } else {
      // Some browsers require that `hash` contains a leading #.
      location.hash = '#' + fragment;
    }
  }

});

//     Backbone.js 1.3.3

//     (c) 2010-2016 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org
// Allow the `Backbone` object to serve as a global event bus, for folks who
// want global "pubsub" in a convenient place.
_.extend(Backbone$1, Events);

// Helpers
// -------

// Helper function to correctly set up the prototype chain for subclasses.
// Similar to `goog.inherits`, but uses a hash of prototype properties and
// class properties to be extended.
var extend = function extend(protoProps, staticProps) {
  var parent = this;
  var child;

  // The constructor function for the new subclass is either defined by you
  // (the "constructor" property in your `extend` definition), or defaulted
  // by us to simply call the parent constructor.
  if (protoProps && _.has(protoProps, 'constructor')) {
    child = protoProps.constructor;
  } else {
    child = function child() {
      return parent.apply(this, arguments);
    };
  }

  // Add static properties to the constructor function, if supplied.
  _.extend(child, parent, staticProps);

  // Set the prototype chain to inherit from `parent`, without calling
  // `parent`'s constructor function and add the prototype properties.
  child.prototype = _.create(parent.prototype, protoProps);
  child.prototype.constructor = child;

  // Set a convenience property in case the parent's prototype is needed
  // later.
  child.__super__ = parent.prototype;

  return child;
};

// Set up inheritance for the model, collection, router, view and history.
Model.extend = Collection.extend = Router.extend = View.extend = History.extend = extend;

Backbone$1.Model = Model;

Backbone$1.Collection = Collection;

Backbone$1.View = View;

Backbone$1.Router = Router;

Backbone$1.History = History;

// Create the default Backbone.history.
Backbone$1.history = new History();
var sync$1 = Backbone$1.sync;

/**
 * Backbone localStorage Adapter
 * Version 1.1.16
 *
 * https://github.com/jeromegn/Backbone.localStorage
 */
// A simple module to replace `Backbone.sync` with *localStorage*-based
// persistence. Models are given GUIDS, and saved into a JSON object. Simple
// as that.

// Generate four random hex digits.
function S4() {
  return ((1 + Math.random()) * 0x10000 | 0).toString(16).substring(1);
}

// Generate a pseudo-GUID by concatenating random hexadecimal.
function guid() {
  return S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4();
}

function isObject(item) {
  return item === Object(item);
}

function contains(array, item) {
  var i = array.length;
  while (i--) {
    if (array[i] === item) return true;
  }return false;
}

function extend$1(obj, props) {
  for (var key in props) {
    obj[key] = props[key];
  }return obj;
}

function result(object, property) {
  if (object == null) return void 0;
  var value = object[property];
  return typeof value === 'function' ? object[property]() : value;
}

// Our Store is represented by a single JS object in *localStorage*. Create it
// with a meaningful name, like the name you'd give a table.
// window.Store is deprectated, use Backbone.LocalStorage instead
var LocalStorage = window.Store = function (name, serializer) {
  if (!this.localStorage) {
    throw "Backbone.localStorage: Environment does not support localStorage.";
  }
  this.name = name;
  this.serializer = serializer || {
    serialize: function serialize(item) {
      return isObject(item) ? JSON.stringify(item) : item;
    },
    // fix for "illegal access" error on Android when JSON.parse is passed null
    deserialize: function deserialize(data) {
      return data && JSON.parse(data);
    }
  };
  var store = this.localStorage().getItem(this.name);
  this.records = store && store.split(",") || [];
};

extend$1(LocalStorage.prototype, {

  // Save the current state of the **Store** to *localStorage*.
  save: function save() {
    this.localStorage().setItem(this.name, this.records.join(","));
  },

  // Add a model, giving it a (hopefully)-unique GUID, if it doesn't already
  // have an id of it's own.
  create: function create(model) {
    if (!model.id && model.id !== 0) {
      model.id = guid();
      model.set(model.idAttribute, model.id);
    }
    this.localStorage().setItem(this._itemName(model.id), this.serializer.serialize(model));
    this.records.push(model.id.toString());
    this.save();
    return this.find(model);
  },

  // Update a model by replacing its copy in `this.data`.
  update: function update(model) {
    this.localStorage().setItem(this._itemName(model.id), this.serializer.serialize(model));
    var modelId = model.id.toString();
    if (!contains(this.records, modelId)) {
      this.records.push(modelId);
      this.save();
    }
    return this.find(model);
  },

  // Retrieve a model from `this.data` by id.
  find: function find(model) {
    return this.serializer.deserialize(this.localStorage().getItem(this._itemName(model.id)));
  },

  // Return the array of all models currently in storage.
  findAll: function findAll() {
    var result = [];
    for (var i = 0, id, data; i < this.records.length; i++) {
      id = this.records[i];
      data = this.serializer.deserialize(this.localStorage().getItem(this._itemName(id)));
      if (data != null) result.push(data);
    }
    return result;
  },

  // Delete a model from `this.data`, returning it.
  destroy: function destroy(model) {
    this.localStorage().removeItem(this._itemName(model.id));
    var modelId = model.id.toString();
    for (var i = 0, id; i < this.records.length; i++) {
      if (this.records[i] === modelId) {
        this.records.splice(i, 1);
      }
    }
    this.save();
    return model;
  },

  localStorage: function (_localStorage) {
    function localStorage() {
      return _localStorage.apply(this, arguments);
    }

    localStorage.toString = function () {
      return _localStorage.toString();
    };

    return localStorage;
  }(function () {
    return localStorage;
  }),

  // Clear localStorage for specific collection.
  _clear: function _clear() {
    var local = this.localStorage(),
        itemRe = new RegExp("^" + this.name + "-");

    // Remove id-tracking item (e.g., "foo").
    local.removeItem(this.name);

    // Match all data items (e.g., "foo-ID") and remove.
    for (var k in local) {
      if (itemRe.test(k)) {
        local.removeItem(k);
      }
    }

    this.records.length = 0;
  },

  // Size of localStorage.
  _storageSize: function _storageSize() {
    return this.localStorage().length;
  },

  _itemName: function _itemName(id) {
    return this.name + "-" + id;
  }

});

// localSync delegate to the model or collection's
// *localStorage* property, which should be an instance of `Store`.
// window.Store.sync and Backbone.localSync is deprecated, use Backbone.LocalStorage.sync instead
LocalStorage.sync = window.Store.sync = Backbone$1.localSync = function (method, model, options) {
  var store = result(model, 'localStorage') || result(model.collection, 'localStorage');

  var resp, errorMessage;
  //If $ is having Deferred - use it.
  var syncDfd = Backbone$1.$ ? Backbone$1.$.Deferred && Backbone$1.$.Deferred() : Backbone$1.Deferred && Backbone$1.Deferred();

  try {

    switch (method) {
      case "read":
        resp = model.id != undefined ? store.find(model) : store.findAll();
        break;
      case "create":
        resp = store.create(model);
        break;
      case "update":
        resp = store.update(model);
        break;
      case "delete":
        resp = store.destroy(model);
        break;
    }
  } catch (error) {
    if (error.code === 22 && store._storageSize() === 0) errorMessage = "Private browsing is unsupported";else errorMessage = error.message;
  }

  if (resp) {
    if (options && options.success) {
      if (Backbone$1.VERSION === "0.9.10") {
        options.success(model, resp, options);
      } else {
        options.success(resp);
      }
    }
    if (syncDfd) {
      syncDfd.resolve(resp);
    }
  } else {
    errorMessage = errorMessage ? errorMessage : "Record Not Found";

    if (options && options.error) if (Backbone$1.VERSION === "0.9.10") {
      options.error(model, errorMessage, options);
    } else {
      options.error(errorMessage);
    }

    if (syncDfd) syncDfd.reject(errorMessage);
  }

  // add compatibility with $.ajax
  // always execute callback for success and error
  if (options && options.complete) options.complete(resp);

  return syncDfd && syncDfd.promise();
};

Backbone$1.ajaxSync = Backbone$1.sync;

Backbone$1.getSyncMethod = function (model, options) {
  var forceAjaxSync = options && options.ajaxSync;

  if (!forceAjaxSync && (result(model, 'localStorage') || result(model.collection, 'localStorage'))) {
    return Backbone$1.localSync;
  }

  return Backbone$1.ajaxSync;
};

// Override 'Backbone.sync' to default to localSync,
// the original 'Backbone.sync' is still available in 'Backbone.ajaxSync'
Backbone$1.sync = function (method, model, options) {
  return Backbone$1.getSyncMethod(model, options).apply(this, [method, model, options]);
};

Backbone$1.LocalStorage = LocalStorage;

var bind$1 = function bind$1(fn, me) {
  return function () {
    return fn.apply(me, arguments);
  };
};
var extend$2 = function extend$2(child, parent) {
  for (var key in parent) {
    if (hasProp.call(parent, key)) child[key] = parent[key];
  }

  function ctor() {
    this.constructor = child;
  }
  ctor.prototype = parent.prototype;
  child.prototype = new ctor();
  child.__super__ = parent.prototype;
  return child;
};
var hasProp = {}.hasOwnProperty;
var indexOf = [].indexOf || function (item) {
  for (var i = 0, l = this.length; i < l; i++) {
    if (i in this && this[i] === item) return i;
  }
  return -1;
};

var focusableElements = ['a[href]', 'area[href]', 'input:not([disabled])', 'select:not([disabled])', 'textarea:not([disabled])', 'button:not([disabled])', 'iframe', 'object', 'embed', '*[tabindex]', '*[contenteditable]'].join(', ');
var Modal = function (superClass) {
  extend$2(Modal, superClass);

  Modal.prototype.prefix = 'bbm';

  Modal.prototype.animate = true;

  Modal.prototype.keyControl = true;

  Modal.prototype.showViewOnRender = true;

  function Modal() {
    this.triggerCancel = bind$1(this.triggerCancel, this);
    this.triggerSubmit = bind$1(this.triggerSubmit, this);
    this.triggerView = bind$1(this.triggerView, this);
    this.clickOutsideElement = bind$1(this.clickOutsideElement, this);
    this.clickOutside = bind$1(this.clickOutside, this);
    this.checkKey = bind$1(this.checkKey, this);
    this.rendererCompleted = bind$1(this.rendererCompleted, this);
    this.args = Array.prototype.slice.apply(arguments);
    Backbone$1.View.prototype.constructor.apply(this, this.args);
    this.setUIElements();
  }

  Modal.prototype.render = function (options) {
    var $focusEl, data, ref;
    data = this.serializeData();
    if (!options || _.isEmpty(options)) {
      options = 0;
    }
    this.$el.addClass(this.prefix + "-wrapper");
    this.modalEl = Backbone$1.$('<div />').addClass(this.prefix + "-modal");
    if (this.template) {
      this.modalEl.html(this.buildTemplate(this.template, data));
    }
    this.$el.html(this.modalEl);
    if (this.viewContainer) {
      this.viewContainerEl = this.modalEl.find(this.viewContainer);
      this.viewContainerEl.addClass(this.prefix + "-modal__views");
    } else {
      this.viewContainerEl = this.modalEl;
    }
    $focusEl = Backbone$1.$(document.activeElement);
    if (!this.previousFocus) {
      this.previousFocus = $focusEl;
    }
    $focusEl.blur();
    if (((ref = this.views) != null ? ref.length : void 0) > 0 && this.showViewOnRender) {
      this.openAt(options);
    }
    if (typeof this.onRender === "function") {
      this.onRender();
    }
    if (this.active) {
      return true;
    }
    this.delegateModalEvents();
    if (this.$el.fadeIn && this.animate) {
      this.modalEl.css({
        opacity: 0
      });
      this.$el.fadeIn({
        duration: 100,
        complete: this.rendererCompleted
      });
    } else {
      this.rendererCompleted();
    }
    return this;
  };

  Modal.prototype.rendererCompleted = function () {
    var ref;
    if (this.keyControl) {
      Backbone$1.$('body').on('keyup.bbm', this.checkKey);
      this.$el.on('mouseup.bbm', this.clickOutsideElement);
      this.$el.on('click.bbm', this.clickOutside);
    }
    this.modalEl.css({
      opacity: 1
    }).addClass(this.prefix + "-modal--open");
    this.setInitialFocus();
    if (typeof this.onShow === "function") {
      this.onShow();
    }
    return (ref = this.currentView) != null ? typeof ref.onShow === "function" ? ref.onShow() : void 0 : void 0;
  };

  Modal.prototype.setInitialFocus = function () {
    if (this.autofocus) {
      return this.$(this.autofocus).focus();
    } else {
      return this.$('*').filter(focusableElements).filter(':visible').first().focus();
    }
  };

  Modal.prototype.setUIElements = function () {
    var ref;
    this.template = this.getOption('template');
    this.views = this.getOption('views');
    if ((ref = this.views) != null) {
      ref.length = _.size(this.views);
    }
    this.viewContainer = this.getOption('viewContainer');
    this.animate = this.getOption('animate');
    if (_.isUndefined(this.template) && _.isUndefined(this.views)) {
      throw new Error('No template or views defined for Backbone.Modal');
    }
    if (this.template && this.views && _.isUndefined(this.viewContainer)) {
      throw new Error('No viewContainer defined for Backbone.Modal');
    }
  };

  Modal.prototype.getOption = function (option) {
    if (!option) {
      return;
    }
    if (this.options && indexOf.call(this.options, option) >= 0 && this.options[option] != null) {
      return this.options[option];
    } else {
      return this[option];
    }
  };

  Modal.prototype.serializeData = function () {
    var data;
    data = {};
    if (this.model) {
      data = _.extend(data, this.model.toJSON());
    }
    if (this.collection) {
      data = _.extend(data, {
        items: this.collection.toJSON()
      });
    }
    return data;
  };

  Modal.prototype.delegateModalEvents = function () {
    var cancelEl, key, match, results, selector, submitEl, trigger$$1;
    this.active = true;
    cancelEl = this.getOption('cancelEl');
    submitEl = this.getOption('submitEl');
    if (submitEl) {
      this.$el.on('click', submitEl, this.triggerSubmit);
    }
    if (cancelEl) {
      this.$el.on('click', cancelEl, this.triggerCancel);
    }
    results = [];
    for (key in this.views) {
      if (_.isString(key) && key !== 'length') {
        match = key.match(/^(\S+)\s*(.*)$/);
        trigger$$1 = match[1];
        selector = match[2];
        results.push(this.$el.on(trigger$$1, selector, this.views[key], this.triggerView));
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  Modal.prototype.undelegateModalEvents = function () {
    var cancelEl, key, match, results, selector, submitEl, trigger$$1;
    this.active = false;
    cancelEl = this.getOption('cancelEl');
    submitEl = this.getOption('submitEl');
    if (submitEl) {
      this.$el.off('click', submitEl, this.triggerSubmit);
    }
    if (cancelEl) {
      this.$el.off('click', cancelEl, this.triggerCancel);
    }
    results = [];
    for (key in this.views) {
      if (_.isString(key) && key !== 'length') {
        match = key.match(/^(\S+)\s*(.*)$/);
        trigger$$1 = match[1];
        selector = match[2];
        results.push(this.$el.off(trigger$$1, selector, this.views[key], this.triggerView));
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  Modal.prototype.checkKey = function (e) {
    if (this.active) {
      switch (e.keyCode) {
        case 27:
          return this.triggerCancel(e);
        case 13:
          return this.triggerSubmit(e);
      }
    }
  };

  Modal.prototype.clickOutside = function (e) {
    var ref;
    if (((ref = this.outsideElement) != null ? ref.hasClass(this.prefix + "-wrapper") : void 0) && this.active) {
      return this.triggerCancel();
    }
  };

  Modal.prototype.clickOutsideElement = function (e) {
    return this.outsideElement = Backbone$1.$(e.target);
  };

  Modal.prototype.buildTemplate = function (template, data) {
    var templateFunction;
    if (typeof template === 'function') {
      templateFunction = template;
    } else {
      templateFunction = _.template(Backbone$1.$(template).html());
    }
    return templateFunction(data);
  };

  Modal.prototype.buildView = function (viewType, options) {
    var view;
    if (!viewType) {
      return;
    }
    if (options && _.isFunction(options)) {
      options = options();
    }
    if (_.isFunction(viewType)) {
      view = new viewType(options || this.args[0]);
      if (view instanceof Backbone$1.View) {
        return {
          el: view.render().$el,
          view: view
        };
      } else {
        return {
          el: viewType(options || this.args[0])
        };
      }
    }
    return {
      view: viewType,
      el: viewType.$el
    };
  };

  Modal.prototype.triggerView = function (e) {
    var base, base1, index, instance, key, options, ref;
    if (e != null) {
      if (typeof e.preventDefault === "function") {
        e.preventDefault();
      }
    }
    options = e.data;
    instance = this.buildView(options.view, options.viewOptions);
    if (this.currentView) {
      this.previousView = this.currentView;
      if (!((ref = options.openOptions) != null ? ref.skipSubmit : void 0)) {
        if ((typeof (base = this.previousView).beforeSubmit === "function" ? base.beforeSubmit(e) : void 0) === false) {
          return;
        }
        if (typeof (base1 = this.previousView).submit === "function") {
          base1.submit();
        }
      }
    }
    this.currentView = instance.view || instance.el;
    index = 0;
    for (key in this.views) {
      if (options.view === this.views[key].view) {
        this.currentIndex = index;
      }
      index++;
    }
    if (options.onActive) {
      if (_.isFunction(options.onActive)) {
        options.onActive(this);
      } else if (_.isString(options.onActive)) {
        this[options.onActive].call(this, options);
      }
    }
    if (this.shouldAnimate) {
      return this.animateToView(instance.el);
    } else {
      this.shouldAnimate = true;
      return this.$(this.viewContainerEl).html(instance.el);
    }
  };

  Modal.prototype.animateToView = function (view) {
    var base, container, newHeight, previousHeight, ref, style, tester;
    style = {
      position: 'relative',
      top: -9999,
      left: -9999
    };
    tester = Backbone$1.$('<tester/>').css(style);
    tester.html(this.$el.clone().css(style));
    if (Backbone$1.$('tester').length !== 0) {
      Backbone$1.$('tester').replaceWith(tester);
    } else {
      Backbone$1.$('body').append(tester);
    }
    if (this.viewContainer) {
      container = tester.find(this.viewContainer);
    } else {
      container = tester.find("." + this.prefix + "-modal");
    }
    container.removeAttr('style');
    previousHeight = container.outerHeight();
    container.html(view);
    newHeight = container.outerHeight();
    if (previousHeight === newHeight) {
      this.$(this.viewContainerEl).html(view);
      if (typeof (base = this.currentView).onShow === "function") {
        base.onShow();
      }
      return (ref = this.previousView) != null ? typeof ref.destroy === "function" ? ref.destroy() : void 0 : void 0;
    } else {
      if (this.animate) {
        this.$(this.viewContainerEl).css({
          opacity: 0
        });
        return this.$(this.viewContainerEl).animate({
          height: newHeight
        }, 100, function (_this) {
          return function () {
            var base1, ref1;
            _this.$(_this.viewContainerEl).css({
              opacity: 1
            }).removeAttr('style');
            _this.$(_this.viewContainerEl).html(view);
            if (typeof (base1 = _this.currentView).onShow === "function") {
              base1.onShow();
            }
            return (ref1 = _this.previousView) != null ? typeof ref1.destroy === "function" ? ref1.destroy() : void 0 : void 0;
          };
        }(this));
      } else {
        return this.$(this.viewContainerEl).css({
          height: newHeight
        }).html(view);
      }
    }
  };

  Modal.prototype.triggerSubmit = function (e) {
    var ref, ref1;
    if (e != null) {
      e.preventDefault();
    }
    if (Backbone$1.$(e != null ? e.target : void 0).is('textarea')) {
      return;
    }
    if (this.beforeSubmit) {
      if (this.beforeSubmit(e) === false) {
        return;
      }
    }
    if (this.currentView && this.currentView.beforeSubmit) {
      if (this.currentView.beforeSubmit(e) === false) {
        return;
      }
    }
    if (!this.submit && !((ref = this.currentView) != null ? ref.submit : void 0) && !this.getOption('submitEl')) {
      return this.triggerCancel();
    }
    if ((ref1 = this.currentView) != null) {
      if (typeof ref1.submit === "function") {
        ref1.submit();
      }
    }
    if (typeof this.submit === "function") {
      this.submit();
    }
    if (this.regionEnabled) {
      return this.trigger('modal:destroy');
    } else {
      return this.destroy();
    }
  };

  Modal.prototype.triggerCancel = function (e) {
    if (e != null) {
      e.preventDefault();
    }
    if (this.beforeCancel) {
      if (this.beforeCancel() === false) {
        return;
      }
    }
    if (typeof this.cancel === "function") {
      this.cancel();
    }
    if (this.regionEnabled) {
      return this.trigger('modal:destroy');
    } else {
      return this.destroy();
    }
  };

  Modal.prototype.destroy = function () {
    var removeViews;
    Backbone$1.$('body').off('keyup.bbm', this.checkKey);
    this.$el.off('mouseup.bbm', this.clickOutsideElement);
    this.$el.off('click.bbm', this.clickOutside);
    Backbone$1.$('tester').remove();
    if (typeof this.onDestroy === "function") {
      this.onDestroy();
    }
    this.shouldAnimate = false;
    this.modalEl.addClass(this.prefix + "-modal--destroy");
    removeViews = function (_this) {
      return function () {
        var ref, ref1;
        if ((ref = _this.currentView) != null) {
          if (typeof ref.remove === "function") {
            ref.remove();
          }
        }
        _this.remove();
        return (ref1 = _this.previousFocus) != null ? typeof ref1.focus === "function" ? ref1.focus() : void 0 : void 0;
      };
    }(this);
    if (this.$el.fadeOut && this.animate) {
      this.$el.fadeOut({
        duration: 200
      });
      return _.delay(function () {
        return removeViews();
      }, 200);
    } else {
      return removeViews();
    }
  };

  Modal.prototype.openAt = function (options) {
    var atIndex, attr, i, key, view;
    if (_.isNumber(options)) {
      atIndex = options;
    } else if (_.isNumber(options._index)) {
      atIndex = options._index;
    }
    i = 0;
    for (key in this.views) {
      if (key !== 'length') {
        if (_.isNumber(atIndex)) {
          if (i === atIndex) {
            view = this.views[key];
          }
          i++;
        } else if (_.isObject(options)) {
          for (attr in this.views[key]) {
            if (options[attr] === this.views[key][attr]) {
              view = this.views[key];
            }
          }
        }
      }
    }
    if (view) {
      this.currentIndex = _.indexOf(this.views, view);
      this.triggerView({
        data: _.extend(view, {
          openOptions: options
        })
      });
    }
    return this;
  };

  Modal.prototype.next = function (options) {
    if (options == null) {
      options = {};
    }
    if (this.currentIndex + 1 < this.views.length) {
      return this.openAt(_.extend(options, {
        _index: this.currentIndex + 1
      }));
    }
  };

  Modal.prototype.previous = function (options) {
    if (options == null) {
      options = {};
    }
    if (this.currentIndex - 1 < this.views.length - 1) {
      return this.openAt(_.extend(options, {
        _index: this.currentIndex - 1
      }));
    }
  };

  return Modal;
}(Backbone$1.View);

Backbone$1.Modal = Modal;

/**
 * Backbone Forms v0.13.0
 *
 * NOTE:
 * This version is for use with RequireJS
 * If using regular <script> tags to include your files, use backbone-forms.min.js
 *
 * Copyright (c) 2013 Charles Davison, Pow Media Ltd
 * 
 * License and more information at:
 * http://github.com/powmedia/backbone-forms
 */

var root$1 = typeof self == 'object' && self.self === self && self || typeof global == 'object' && global.global === global && global;

//==================================================================================================
//FORM
//==================================================================================================

var Form = Backbone$1.View.extend({

  /**
   * Constructor
   * 
   * @param {Object} [options.schema]
   * @param {Backbone.Model} [options.model]
   * @param {Object} [options.data]
   * @param {String[]|Object[]} [options.fieldsets]
   * @param {String[]} [options.fields]
   * @param {String} [options.idPrefix]
   * @param {Form.Field} [options.Field]
   * @param {Form.Fieldset} [options.Fieldset]
   * @param {Function} [options.template]
   */
  initialize: function initialize(options) {
    var self = this;

    options = options || {};

    //Find the schema to use
    var schema = this.schema = function () {
      //Prefer schema from options
      if (options.schema) return _.result(options, 'schema');

      //Then schema on model
      var model = options.model;
      if (model && model.schema) {
        return _.isFunction(model.schema) ? model.schema() : model.schema;
      }

      //Then built-in schema
      if (self.schema) {
        return _.isFunction(self.schema) ? self.schema() : self.schema;
      }

      //Fallback to empty schema
      return {};
    }();

    //Store important data
    _.extend(this, _.pick(options, 'model', 'data', 'idPrefix', 'templateData'));

    //Override defaults
    var constructor = this.constructor;
    this.template = options.template || this.template || constructor.template;
    this.Fieldset = options.Fieldset || this.Fieldset || constructor.Fieldset;
    this.Field = options.Field || this.Field || constructor.Field;
    this.NestedField = options.NestedField || this.NestedField || constructor.NestedField;

    //Check which fields will be included (defaults to all)
    var selectedFields = this.selectedFields = options.fields || _.keys(schema);

    //Create fields
    var fields = this.fields = {};

    _.each(selectedFields, function (key) {
      var fieldSchema = schema[key];
      fields[key] = this.createField(key, fieldSchema);
    }, this);

    //Create fieldsets
    var fieldsetSchema = options.fieldsets || [selectedFields],
        fieldsets = this.fieldsets = [];

    _.each(fieldsetSchema, function (itemSchema) {
      this.fieldsets.push(this.createFieldset(itemSchema));
    }, this);
  },

  /**
   * Creates a Fieldset instance
   *
   * @param {String[]|Object[]} schema       Fieldset schema
   *
   * @return {Form.Fieldset}
   */
  createFieldset: function createFieldset(schema) {
    var options = {
      schema: schema,
      fields: this.fields
    };

    return new this.Fieldset(options);
  },

  /**
   * Creates a Field instance
   *
   * @param {String} key
   * @param {Object} schema       Field schema
   *
   * @return {Form.Field}
   */
  createField: function createField(key, schema) {
    var options = {
      form: this,
      key: key,
      schema: schema,
      idPrefix: this.idPrefix
    };

    if (this.model) {
      options.model = this.model;
    } else if (this.data) {
      options.value = this.data[key];
    } else {
      options.value = null;
    }

    var field = new this.Field(options);

    this.listenTo(field.editor, 'all', this.handleEditorEvent);

    return field;
  },

  /**
   * Callback for when an editor event is fired.
   * Re-triggers events on the form as key:event and triggers additional form-level events
   *
   * @param {String} event
   * @param {Editor} editor
   */
  handleEditorEvent: function handleEditorEvent(event, editor) {
    //Re-trigger editor events on the form
    var formEvent = editor.key + ':' + event;

    this.trigger.call(this, formEvent, this, editor, Array.prototype.slice.call(arguments, 2));

    //Trigger additional events
    switch (event) {
      case 'change':
        this.trigger('change', this);
        break;

      case 'focus':
        if (!this.hasFocus) this.trigger('focus', this);
        break;

      case 'blur':
        if (this.hasFocus) {
          //TODO: Is the timeout etc needed?
          var self = this;
          setTimeout(function () {
            var focusedField = _.find(self.fields, function (field) {
              return field.editor.hasFocus;
            });

            if (!focusedField) self.trigger('blur', self);
          }, 0);
        }
        break;
    }
  },

  render: function render() {
    var self = this,
        fields = this.fields;

    //Render form
    var $form = $($.trim(this.template(_.result(this, 'templateData'))));

    //Render standalone editors
    $form.find('[data-editors]').add($form).each(function (i, el) {
      var $container = $(el),
          selection = $container.attr('data-editors');

      if (_.isUndefined(selection)) return;

      //Work out which fields to include
      var keys = selection == '*' ? self.selectedFields || _.keys(fields) : selection.split(',');

      //Add them
      _.each(keys, function (key) {
        var field = fields[key];

        $container.append(field.editor.render().el);
      });
    });

    //Render standalone fields
    $form.find('[data-fields]').add($form).each(function (i, el) {
      var $container = $(el),
          selection = $container.attr('data-fields');

      if (_.isUndefined(selection)) return;

      //Work out which fields to include
      var keys = selection == '*' ? self.selectedFields || _.keys(fields) : selection.split(',');

      //Add them
      _.each(keys, function (key) {
        var field = fields[key];

        $container.append(field.render().el);
      });
    });

    //Render fieldsets
    $form.find('[data-fieldsets]').add($form).each(function (i, el) {
      var $container = $(el),
          selection = $container.attr('data-fieldsets');

      if (_.isUndefined(selection)) return;

      _.each(self.fieldsets, function (fieldset) {
        $container.append(fieldset.render().el);
      });
    });

    //Set the main element
    this.setElement($form);

    //Set class
    $form.addClass(this.className);

    return this;
  },

  /**
   * Validate the data
   *
   * @return {Object}       Validation errors
   */
  validate: function validate(options) {
    var self = this,
        fields = this.fields,
        model = this.model,
        errors = {};

    options = options || {};

    //Collect errors from schema validation
    _.each(fields, function (field) {
      var error = field.validate();
      if (error) {
        errors[field.key] = error;
      }
    });

    //Get errors from default Backbone model validator
    if (!options.skipModelValidate && model && model.validate) {
      var modelErrors = model.validate(this.getValue());

      if (modelErrors) {
        var isDictionary = _.isObject(modelErrors) && !_.isArray(modelErrors);

        //If errors are not in object form then just store on the error object
        if (!isDictionary) {
          errors._others = errors._others || [];
          errors._others.push(modelErrors);
        }

        //Merge programmatic errors (requires model.validate() to return an object e.g. { fieldKey: 'error' })
        if (isDictionary) {
          _.each(modelErrors, function (val, key) {
            //Set error on field if there isn't one already
            if (fields[key] && !errors[key]) {
              fields[key].setError(val);
              errors[key] = val;
            } else {
              //Otherwise add to '_others' key
              errors._others = errors._others || [];
              var tmpErr = {};
              tmpErr[key] = val;
              errors._others.push(tmpErr);
            }
          });
        }
      }
    }

    return _.isEmpty(errors) ? null : errors;
  },

  /**
   * Update the model with all latest values.
   *
   * @param {Object} [options]  Options to pass to Model#set (e.g. { silent: true })
   *
   * @return {Object}  Validation errors
   */
  commit: function commit(options) {
    //Validate
    options = options || {};

    var validateOptions = {
      skipModelValidate: !options.validate
    };

    var errors = this.validate(validateOptions);
    if (errors) return errors;

    //Commit
    var modelError;

    var setOptions = _.extend({
      error: function error(model, e) {
        modelError = e;
      }
    }, options);

    this.model.set(this.getValue(), setOptions);

    if (modelError) return modelError;
  },

  /**
   * Get all the field values as an object.
   * Use this method when passing data instead of objects
   *
   * @param {String} [key]    Specific field value to get
   */
  getValue: function getValue(key) {
    //Return only given key if specified
    if (key) return this.fields[key].getValue();

    //Otherwise return entire form
    var values = {};
    _.each(this.fields, function (field) {
      values[field.key] = field.getValue();
    });

    return values;
  },

  /**
   * Update field values, referenced by key
   *
   * @param {Object|String} key     New values to set, or property to set
   * @param val                     Value to set
   */
  setValue: function setValue(prop, val) {
    var data = {};
    if (typeof prop === 'string') {
      data[prop] = val;
    } else {
      data = prop;
    }

    var key;
    for (key in this.schema) {
      if (data[key] !== undefined) {
        this.fields[key].setValue(data[key]);
      }
    }
  },

  /**
   * Returns the editor for a given field key
   *
   * @param {String} key
   *
   * @return {Editor}
   */
  getEditor: function getEditor(key) {
    var field = this.fields[key];
    if (!field) throw new Error('Field not found: ' + key);

    return field.editor;
  },

  /**
   * Gives the first editor in the form focus
   */
  focus: function focus() {
    if (this.hasFocus) return;

    //Get the first field
    var fieldset = this.fieldsets[0],
        field = fieldset.getFieldAt(0);

    if (!field) return;

    //Set focus
    field.editor.focus();
  },

  /**
   * Removes focus from the currently focused editor
   */
  blur: function blur() {
    if (!this.hasFocus) return;

    var focusedField = _.find(this.fields, function (field) {
      return field.editor.hasFocus;
    });

    if (focusedField) focusedField.editor.blur();
  },

  /**
   * Manages the hasFocus property
   *
   * @param {String} event
   */
  trigger: function trigger(event) {
    if (event === 'focus') {
      this.hasFocus = true;
    } else if (event === 'blur') {
      this.hasFocus = false;
    }

    return Backbone$1.View.prototype.trigger.apply(this, arguments);
  },

  /**
   * Override default remove function in order to remove embedded views
   *
   * TODO: If editors are included directly with data-editors="x", they need to be removed
   * May be best to use XView to manage adding/removing views
   */
  remove: function remove() {
    _.each(this.fieldsets, function (fieldset) {
      fieldset.remove();
    });

    _.each(this.fields, function (field) {
      field.remove();
    });

    return Backbone$1.View.prototype.remove.apply(this, arguments);
  }

}, {

  //STATICS
  template: _.template('\
    <form data-fieldsets></form>\
  ', null, root$1.templateSettings),

  templateSettings: {
    evaluate: /<%([\s\S]+?)%>/g,
    interpolate: /<%=([\s\S]+?)%>/g,
    escape: /<%-([\s\S]+?)%>/g
  },

  editors: {}

});

//==================================================================================================
//VALIDATORS
//==================================================================================================

Form.validators = function () {

  var validators = {};

  validators.errMessages = {
    required: 'Required',
    regexp: 'Invalid',
    email: 'Invalid email address',
    url: 'Invalid URL',
    match: _.template('Must match field "<%= field %>"', null, Form.templateSettings)
  };

  validators.required = function (options) {
    options = _.extend({
      type: 'required',
      message: this.errMessages.required
    }, options);

    return function required(value) {
      options.value = value;

      var err = {
        type: options.type,
        message: _.isFunction(options.message) ? options.message(options) : options.message
      };

      if (value === null || value === undefined || value === false || value === '') return err;
    };
  };

  validators.regexp = function (options) {
    if (!options.regexp) throw new Error('Missing required "regexp" option for "regexp" validator');

    options = _.extend({
      type: 'regexp',
      message: this.errMessages.regexp
    }, options);

    return function regexp(value) {
      options.value = value;

      var err = {
        type: options.type,
        message: _.isFunction(options.message) ? options.message(options) : options.message
      };

      //Don't check empty values (add a 'required' validator for this)
      if (value === null || value === undefined || value === '') return;

      if (!options.regexp.test(value)) return err;
    };
  };

  validators.email = function (options) {
    options = _.extend({
      type: 'email',
      message: this.errMessages.email,
      regexp: /^[\w\-]{1,}([\w\-\+.]{1,1}[\w\-]{1,}){0,}[@][\w\-]{1,}([.]([\w\-]{1,})){1,3}$/
    }, options);

    return validators.regexp(options);
  };

  validators.url = function (options) {
    options = _.extend({
      type: 'url',
      message: this.errMessages.url,
      regexp: /^(http|https):\/\/(([A-Z0-9][A-Z0-9_\-]*)(\.[A-Z0-9][A-Z0-9_\-]*)+)(:(\d+))?\/?/i
    }, options);

    return validators.regexp(options);
  };

  validators.match = function (options) {
    if (!options.field) throw new Error('Missing required "field" options for "match" validator');

    options = _.extend({
      type: 'match',
      message: this.errMessages.match
    }, options);

    return function match(value, attrs) {
      options.value = value;

      var err = {
        type: options.type,
        message: _.isFunction(options.message) ? options.message(options) : options.message
      };

      //Don't check empty values (add a 'required' validator for this)
      if (value === null || value === undefined || value === '') return;

      if (value !== attrs[options.field]) return err;
    };
  };

  return validators;
}();

//==================================================================================================
//FIELDSET
//==================================================================================================

Form.Fieldset = Backbone$1.View.extend({

  /**
   * Constructor
   *
   * Valid fieldset schemas:
   *   ['field1', 'field2']
   *   { legend: 'Some Fieldset', fields: ['field1', 'field2'] }
   *
   * @param {String[]|Object[]} options.schema      Fieldset schema
   * @param {Object} options.fields           Form fields
   */
  initialize: function initialize(options) {
    options = options || {};

    //Create the full fieldset schema, merging defaults etc.
    var schema = this.schema = this.createSchema(options.schema);

    //Store the fields for this fieldset
    this.fields = _.pick(options.fields, schema.fields);

    //Override defaults
    this.template = options.template || this.constructor.template;
  },

  /**
   * Creates the full fieldset schema, normalising, merging defaults etc.
   *
   * @param {String[]|Object[]} schema
   *
   * @return {Object}
   */
  createSchema: function createSchema(schema) {
    //Normalise to object
    if (_.isArray(schema)) {
      schema = {
        fields: schema
      };
    }

    //Add null legend to prevent template error
    schema.legend = schema.legend || null;

    return schema;
  },

  /**
   * Returns the field for a given index
   *
   * @param {Number} index
   *
   * @return {Field}
   */
  getFieldAt: function getFieldAt(index) {
    var key = this.schema.fields[index];

    return this.fields[key];
  },

  /**
   * Returns data to pass to template
   *
   * @return {Object}
   */
  templateData: function templateData() {
    return this.schema;
  },

  /**
   * Renders the fieldset and fields
   *
   * @return {Fieldset} this
   */
  render: function render() {
    var schema = this.schema,
        fields = this.fields;

    //Render fieldset
    var $fieldset = $($.trim(this.template(_.result(this, 'templateData'))));

    //Render fields
    $fieldset.find('[data-fields]').add($fieldset).each(function (i, el) {
      var $container = $(el),
          selection = $container.attr('data-fields');

      if (_.isUndefined(selection)) return;

      _.each(fields, function (field) {
        $container.append(field.render().el);
      });
    });

    this.setElement($fieldset);

    return this;
  },

  /**
   * Remove embedded views then self
   */
  remove: function remove() {
    _.each(this.fields, function (field) {
      field.remove();
    });

    Backbone$1.View.prototype.remove.call(this);
  }

}, {
  //STATICS

  template: _.template('\
    <fieldset data-fields>\
      <% if (legend) { %>\
        <legend><%= legend %></legend>\
      <% } %>\
    </fieldset>\
  ', null, Form.templateSettings)

});

//==================================================================================================
//FIELD
//==================================================================================================

Form.Field = Backbone$1.View.extend({

  /**
   * Constructor
   * 
   * @param {Object} options.key
   * @param {Object} options.form
   * @param {Object} [options.schema]
   * @param {Function} [options.schema.template]
   * @param {Backbone.Model} [options.model]
   * @param {Object} [options.value]
   * @param {String} [options.idPrefix]
   * @param {Function} [options.template]
   * @param {Function} [options.errorClassName]
   */
  initialize: function initialize(options) {
    options = options || {};

    //Store important data
    _.extend(this, _.pick(options, 'form', 'key', 'model', 'value', 'idPrefix'));

    //Create the full field schema, merging defaults etc.
    var schema = this.schema = this.createSchema(options.schema);

    //Override defaults
    this.template = options.template || schema.template || this.constructor.template;
    this.errorClassName = options.errorClassName || this.constructor.errorClassName;

    //Create editor
    this.editor = this.createEditor();
  },

  /**
   * Creates the full field schema, merging defaults etc.
   *
   * @param {Object|String} schema
   *
   * @return {Object}
   */
  createSchema: function createSchema(schema) {
    if (_.isString(schema)) schema = {
      type: schema
    };

    //Set defaults
    schema = _.extend({
      type: 'Text',
      title: this.createTitle()
    }, schema);

    //Get the real constructor function i.e. if type is a string such as 'Text'
    schema.type = _.isString(schema.type) ? Form.editors[schema.type] : schema.type;

    return schema;
  },

  /**
   * Creates the editor specified in the schema; either an editor string name or
   * a constructor function
   *
   * @return {View}
   */
  createEditor: function createEditor() {
    var options = _.extend(_.pick(this, 'schema', 'form', 'key', 'model', 'value'), {
      id: this.createEditorId()
    });

    var constructorFn = this.schema.type;

    return new constructorFn(options);
  },

  /**
   * Creates the ID that will be assigned to the editor
   *
   * @return {String}
   */
  createEditorId: function createEditorId() {
    var prefix = this.idPrefix,
        id = this.key;

    //Replace periods with underscores (e.g. for when using paths)
    id = id.replace(/\./g, '_');

    //If a specific ID prefix is set, use it
    if (_.isString(prefix) || _.isNumber(prefix)) return prefix + id;
    if (_.isNull(prefix)) return id;

    //Otherwise, if there is a model use it's CID to avoid conflicts when multiple forms are on the page
    if (this.model) return this.model.cid + '_' + id;

    return id;
  },

  /**
   * Create the default field title (label text) from the key name.
   * (Converts 'camelCase' to 'Camel Case')
   *
   * @return {String}
   */
  createTitle: function createTitle() {
    var str = this.key;

    //Add spaces
    str = str.replace(/([A-Z])/g, ' $1');

    //Uppercase first character
    str = str.replace(/^./, function (str) {
      return str.toUpperCase();
    });

    return str;
  },

  /**
   * Returns the data to be passed to the template
   *
   * @return {Object}
   */
  templateData: function templateData() {
    var schema = this.schema;

    return {
      help: schema.help || '',
      title: schema.title,
      fieldAttrs: schema.fieldAttrs,
      editorAttrs: schema.editorAttrs,
      key: this.key,
      editorId: this.editor.id
    };
  },

  /**
   * Render the field and editor
   *
   * @return {Field} self
   */
  render: function render() {
    var schema = this.schema,
        editor = this.editor;

    //Only render the editor if Hidden
    if (schema.type == Form.editors.Hidden) {
      return this.setElement(editor.render().el);
    }

    //Render field
    var $field = $($.trim(this.template(_.result(this, 'templateData'))));

    if (schema.fieldClass) $field.addClass(schema.fieldClass);
    if (schema.fieldAttrs) $field.attr(schema.fieldAttrs);

    //Render editor
    $field.find('[data-editor]').add($field).each(function (i, el) {
      var $container = $(el),
          selection = $container.attr('data-editor');

      if (_.isUndefined(selection)) return;

      $container.append(editor.render().el);
    });

    this.setElement($field);

    return this;
  },

  /**
   * Check the validity of the field
   *
   * @return {String}
   */
  validate: function validate() {
    var error = this.editor.validate();

    if (error) {
      this.setError(error.message);
    } else {
      this.clearError();
    }

    return error;
  },

  /**
   * Set the field into an error state, adding the error class and setting the error message
   *
   * @param {String} msg     Error message
   */
  setError: function setError(msg) {
    //Nested form editors (e.g. Object) set their errors internally
    if (this.editor.hasNestedForm) return;

    //Add error CSS class
    this.$el.addClass(this.errorClassName);

    //Set error message
    this.$('[data-error]').html(msg);
  },

  /**
   * Clear the error state and reset the help message
   */
  clearError: function clearError() {
    //Remove error CSS class
    this.$el.removeClass(this.errorClassName);

    //Clear error message
    this.$('[data-error]').empty();
  },

  /**
   * Update the model with the new value from the editor
   *
   * @return {Mixed}
   */
  commit: function commit() {
    return this.editor.commit();
  },

  /**
   * Get the value from the editor
   *
   * @return {Mixed}
   */
  getValue: function getValue() {
    return this.editor.getValue();
  },

  /**
   * Set/change the value of the editor
   *
   * @param {Mixed} value
   */
  setValue: function setValue(value) {
    this.editor.setValue(value);
  },

  /**
   * Give the editor focus
   */
  focus: function focus() {
    this.editor.focus();
  },

  /**
   * Remove focus from the editor
   */
  blur: function blur() {
    this.editor.blur();
  },

  /**
   * Remove the field and editor views
   */
  remove: function remove() {
    this.editor.remove();

    Backbone$1.View.prototype.remove.call(this);
  }

}, {
  //STATICS

  template: _.template('\
    <div>\
      <label for="<%= editorId %>"><%= title %></label>\
      <div>\
        <span data-editor></span>\
        <div data-error></div>\
        <div><%= help %></div>\
      </div>\
    </div>\
  ', null, Form.templateSettings),

  /**
   * CSS class name added to the field when there is a validation error
   */
  errorClassName: 'error'

});

//==================================================================================================
//NESTEDFIELD
//==================================================================================================

Form.NestedField = Form.Field.extend({

  template: _.template($.trim('\
    <div>\
      <span data-editor></span>\
      <% if (help) { %>\
        <div><%= help %></div>\
      <% } %>\
      <div data-error></div>\
    </div>\
  '), null, Form.templateSettings)

});

/**
 * Base editor (interface). To be extended, not used directly
 *
 * @param {Object} options
 * @param {String} [options.id]         Editor ID
 * @param {Model} [options.model]       Use instead of value, and use commit()
 * @param {String} [options.key]        The model attribute key. Required when using 'model'
 * @param {Mixed} [options.value]       When not using a model. If neither provided, defaultValue will be used
 * @param {Object} [options.schema]     Field schema; may be required by some editors
 * @param {Object} [options.validators] Validators; falls back to those stored on schema
 * @param {Object} [options.form]       The form
 */
Form.Editor = Form.editors.Base = Backbone$1.View.extend({

  defaultValue: null,

  hasFocus: false,

  initialize: function initialize(options) {
    var options = options || {};

    //Set initial value
    if (options.model) {
      if (!options.key) throw new Error("Missing option: 'key'");

      this.model = options.model;

      this.value = this.model.get(options.key);
    } else if (options.value !== undefined) {
      this.value = options.value;
    }

    if (this.value === undefined) this.value = this.defaultValue;

    //Store important data
    _.extend(this, _.pick(options, 'key', 'form'));

    var schema = this.schema = options.schema || {};

    this.validators = options.validators || schema.validators;

    //Main attributes
    this.$el.attr('id', this.id);
    this.$el.attr('name', this.getName());
    if (schema.editorClass) this.$el.addClass(schema.editorClass);
    if (schema.editorAttrs) this.$el.attr(schema.editorAttrs);
  },

  /**
   * Get the value for the form input 'name' attribute
   *
   * @return {String}
   *
   * @api private
   */
  getName: function getName() {
    var key = this.key || '';

    //Replace periods with underscores (e.g. for when using paths)
    return key.replace(/\./g, '_');
  },

  /**
   * Get editor value
   * Extend and override this method to reflect changes in the DOM
   *
   * @return {Mixed}
   */
  getValue: function getValue() {
    return this.value;
  },

  /**
   * Set editor value
   * Extend and override this method to reflect changes in the DOM
   *
   * @param {Mixed} value
   */
  setValue: function setValue(value) {
    this.value = value;
  },

  /**
   * Give the editor focus
   * Extend and override this method
   */
  focus: function focus() {
    throw new Error('Not implemented');
  },

  /**
   * Remove focus from the editor
   * Extend and override this method
   */
  blur: function blur() {
    throw new Error('Not implemented');
  },

  /**
   * Update the model with the current value
   *
   * @param {Object} [options]              Options to pass to model.set()
   * @param {Boolean} [options.validate]    Set to true to trigger built-in model validation
   *
   * @return {Mixed} error
   */
  commit: function commit(options) {
    var error = this.validate();
    if (error) return error;

    this.listenTo(this.model, 'invalid', function (model, e) {
      error = e;
    });
    this.model.set(this.key, this.getValue(), options);

    if (error) return error;
  },

  /**
   * Check validity
   *
   * @return {Object|Undefined}
   */
  validate: function validate() {
    var $el = this.$el,
        error = null,
        value = this.getValue(),
        formValues = this.form ? this.form.getValue() : {},
        validators = this.validators,
        getValidator = this.getValidator;

    if (validators) {
      //Run through validators until an error is found
      _.every(validators, function (validator) {
        error = getValidator(validator)(value, formValues);

        return error ? false : true;
      });
    }

    return error;
  },

  /**
   * Set this.hasFocus, or call parent trigger()
   *
   * @param {String} event
   */
  trigger: function trigger(event) {
    if (event === 'focus') {
      this.hasFocus = true;
    } else if (event === 'blur') {
      this.hasFocus = false;
    }

    return Backbone$1.View.prototype.trigger.apply(this, arguments);
  },

  /**
   * Returns a validation function based on the type defined in the schema
   *
   * @param {RegExp|String|Function} validator
   * @return {Function}
   */
  getValidator: function getValidator(validator) {
    var validators = Form.validators;

    //Convert regular expressions to validators
    if (_.isRegExp(validator)) {
      return validators.regexp({
        regexp: validator
      });
    }

    //Use a built-in validator if given a string
    if (_.isString(validator)) {
      if (!validators[validator]) throw new Error('Validator "' + validator + '" not found');

      return validators[validator]();
    }

    //Functions can be used directly
    if (_.isFunction(validator)) return validator;

    //Use a customised built-in validator if given an object
    if (_.isObject(validator) && validator.type) {
      var config = validator;

      return validators[config.type](config);
    }

    //Unkown validator type
    throw new Error('Invalid validator: ' + validator);
  }
});

/**
 * Text
 * 
 * Text input with focus, blur and change events
 */
Form.editors.Text = Form.Editor.extend({

  tagName: 'input',

  defaultValue: '',

  previousValue: '',

  events: {
    'keyup': 'determineChange',
    'keypress': function keypress(event) {
      var self = this;
      setTimeout(function () {
        self.determineChange();
      }, 0);
    },
    'select': function select(event) {
      this.trigger('select', this);
    },
    'focus': function focus(event) {
      this.trigger('focus', this);
    },
    'blur': function blur(event) {
      this.trigger('blur', this);
    }
  },

  initialize: function initialize(options) {
    Form.editors.Base.prototype.initialize.call(this, options);

    var schema = this.schema;

    //Allow customising text type (email, phone etc.) for HTML5 browsers
    var type = 'text';

    if (schema && schema.editorAttrs && schema.editorAttrs.type) type = schema.editorAttrs.type;
    if (schema && schema.dataType) type = schema.dataType;

    this.$el.attr('type', type);
  },

  /**
   * Adds the editor to the DOM
   */
  render: function render() {
    this.setValue(this.value);

    return this;
  },

  determineChange: function determineChange(event) {
    var currentValue = this.$el.val();
    var changed = currentValue !== this.previousValue;

    if (changed) {
      this.previousValue = currentValue;

      this.trigger('change', this);
    }
  },

  /**
   * Returns the current editor value
   * @return {String}
   */
  getValue: function getValue() {
    return this.$el.val();
  },

  /**
   * Sets the value of the form element
   * @param {String}
   */
  setValue: function setValue(value) {
    this.$el.val(value);
  },

  focus: function focus() {
    if (this.hasFocus) return;

    this.$el.focus();
  },

  blur: function blur() {
    if (!this.hasFocus) return;

    this.$el.blur();
  },

  select: function select() {
    this.$el.select();
  }

});

/**
 * TextArea editor
 */
Form.editors.TextArea = Form.editors.Text.extend({

  tagName: 'textarea',

  /**
   * Override Text constructor so type property isn't set (issue #261)
   */
  initialize: function initialize(options) {
    Form.editors.Base.prototype.initialize.call(this, options);
  }

});

/**
 * Password editor
 */
Form.editors.Password = Form.editors.Text.extend({

  initialize: function initialize(options) {
    Form.editors.Text.prototype.initialize.call(this, options);

    this.$el.attr('type', 'password');
  }

});

/**
 * NUMBER
 * 
 * Normal text input that only allows a number. Letters etc. are not entered.
 */
Form.editors.Number = Form.editors.Text.extend({

  defaultValue: 0,

  events: _.extend({}, Form.editors.Text.prototype.events, {
    'keypress': 'onKeyPress',
    'change': 'onKeyPress'
  }),

  initialize: function initialize(options) {
    Form.editors.Text.prototype.initialize.call(this, options);

    var schema = this.schema;

    this.$el.attr('type', 'number');

    if (!schema || !schema.editorAttrs || !schema.editorAttrs.step) {
      // provide a default for `step` attr,
      // but don't overwrite if already specified
      this.$el.attr('step', 'any');
    }
  },

  /**
   * Check value is numeric
   */
  onKeyPress: function onKeyPress(event) {
    var self = this,
        delayedDetermineChange = function delayedDetermineChange() {
      setTimeout(function () {
        self.determineChange();
      }, 0);
    };

    //Allow backspace
    if (event.charCode === 0) {
      delayedDetermineChange();
      return;
    }

    //Get the whole new value so that we can prevent things like double decimals points etc.
    var newVal = this.$el.val();
    if (event.charCode != undefined) {
      newVal = newVal + String.fromCharCode(event.charCode);
    }

    var numeric = /^[0-9]*\.?[0-9]*?$/.test(newVal);

    if (numeric) {
      delayedDetermineChange();
    } else {
      event.preventDefault();
    }
  },

  getValue: function getValue() {
    var value = this.$el.val();

    return value === "" ? null : parseFloat(value, 10);
  },

  setValue: function setValue(value) {
    value = function () {
      if (_.isNumber(value)) return value;

      if (_.isString(value) && value !== '') return parseFloat(value, 10);

      return null;
    }();

    if (_.isNaN(value)) value = null;

    Form.editors.Text.prototype.setValue.call(this, value);
  }

});

/**
 * Hidden editor
 */
Form.editors.Hidden = Form.editors.Text.extend({

  defaultValue: '',

  initialize: function initialize(options) {
    Form.editors.Text.prototype.initialize.call(this, options);

    this.$el.attr('type', 'hidden');
  },

  focus: function focus() {},

  blur: function blur() {}

});

/**
 * Checkbox editor
 *
 * Creates a single checkbox, i.e. boolean value
 */
Form.editors.Checkbox = Form.editors.Base.extend({

  defaultValue: false,

  tagName: 'input',

  events: {
    'click': function click(event) {
      this.trigger('change', this);
    },
    'focus': function focus(event) {
      this.trigger('focus', this);
    },
    'blur': function blur(event) {
      this.trigger('blur', this);
    }
  },

  initialize: function initialize(options) {
    Form.editors.Base.prototype.initialize.call(this, options);

    this.$el.attr('type', 'checkbox');
  },

  /**
   * Adds the editor to the DOM
   */
  render: function render() {
    this.setValue(this.value);

    return this;
  },

  getValue: function getValue() {
    return this.$el.prop('checked');
  },

  setValue: function setValue(value) {
    if (value) {
      this.$el.prop('checked', true);
    } else {
      this.$el.prop('checked', false);
    }
  },

  focus: function focus() {
    if (this.hasFocus) return;

    this.$el.focus();
  },

  blur: function blur() {
    if (!this.hasFocus) return;

    this.$el.blur();
  }

});

/**
 * Select editor
 *
 * Renders a <select> with given options
 *
 * Requires an 'options' value on the schema.
 *  Can be an array of options, a function that calls back with the array of options, a string of HTML
 *  or a Backbone collection. If a collection, the models must implement a toString() method
 */
Form.editors.Select = Form.editors.Base.extend({

  tagName: 'select',

  events: {
    'change': function change(event) {
      this.trigger('change', this);
    },
    'focus': function focus(event) {
      this.trigger('focus', this);
    },
    'blur': function blur(event) {
      this.trigger('blur', this);
    }
  },

  initialize: function initialize(options) {
    Form.editors.Base.prototype.initialize.call(this, options);

    if (!this.schema || !this.schema.options) throw new Error("Missing required 'schema.options'");
  },

  render: function render() {
    this.setOptions(this.schema.options);

    return this;
  },

  /**
   * Sets the options that populate the <select>
   *
   * @param {Mixed} options
   */
  setOptions: function setOptions(options) {
    var self = this;

    //If a collection was passed, check if it needs fetching
    if (options instanceof Backbone$1.Collection) {
      var collection = options;

      //Don't do the fetch if it's already populated
      if (collection.length > 0) {
        this.renderOptions(options);
      } else {
        collection.fetch({
          success: function success(collection) {
            self.renderOptions(options);
          }
        });
      }
    }

    //If a function was passed, run it to get the options
    else if (_.isFunction(options)) {
        options(function (result) {
          self.renderOptions(result);
        }, self);
      }

      //Otherwise, ready to go straight to renderOptions
      else {
          this.renderOptions(options);
        }
  },

  /**
   * Adds the <option> html to the DOM
   * @param {Mixed}   Options as a simple array e.g. ['option1', 'option2']
   *                      or as an array of objects e.g. [{val: 543, label: 'Title for object 543'}]
   *                      or as a string of <option> HTML to insert into the <select>
   *                      or any object
   */
  renderOptions: function renderOptions(options) {
    var $select = this.$el,
        html;

    html = this._getOptionsHtml(options);

    //Insert options
    $select.html(html);

    //Select correct option
    this.setValue(this.value);
  },

  _getOptionsHtml: function _getOptionsHtml(options) {
    var html;
    //Accept string of HTML
    if (_.isString(options)) {
      html = options;
    }

    //Or array
    else if (_.isArray(options)) {
        html = this._arrayToHtml(options);
      }

      //Or Backbone collection
      else if (options instanceof Backbone$1.Collection) {
          html = this._collectionToHtml(options);
        } else if (_.isFunction(options)) {
          var newOptions;

          options(function (opts) {
            newOptions = opts;
          }, this);

          html = this._getOptionsHtml(newOptions);
          //Or any object
        } else {
          html = this._objectToHtml(options);
        }

    return html;
  },

  getValue: function getValue() {
    return this.$el.val();
  },

  setValue: function setValue(value) {
    this.$el.val(value);
  },

  focus: function focus() {
    if (this.hasFocus) return;

    this.$el.focus();
  },

  blur: function blur() {
    if (!this.hasFocus) return;

    this.$el.blur();
  },

  /**
   * Transforms a collection into HTML ready to use in the renderOptions method
   * @param {Backbone.Collection}
   * @return {String}
   */
  _collectionToHtml: function _collectionToHtml(collection) {
    //Convert collection to array first
    var array = [];
    collection.each(function (model) {
      array.push({
        val: model.id,
        label: model.toString()
      });
    });

    //Now convert to HTML
    var html = this._arrayToHtml(array);

    return html;
  },
  /**
   * Transforms an object into HTML ready to use in the renderOptions method
   * @param {Object}
   * @return {String}
   */
  _objectToHtml: function _objectToHtml(obj) {
    //Convert object to array first
    var array = [];
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        array.push({
          val: key,
          label: obj[key]
        });
      }
    }

    //Now convert to HTML
    var html = this._arrayToHtml(array);

    return html;
  },

  /**
   * Create the <option> HTML
   * @param {Array}   Options as a simple array e.g. ['option1', 'option2']
   *                      or as an array of objects e.g. [{val: 543, label: 'Title for object 543'}]
   * @return {String} HTML
   */
  _arrayToHtml: function _arrayToHtml(array) {
    var html = [];

    //Generate HTML
    _.each(array, function (option) {
      if (_.isObject(option)) {
        if (option.group) {
          html.push('<optgroup label="' + option.group + '">');
          html.push(this._getOptionsHtml(option.options));
          html.push('</optgroup>');
        } else {
          var val = option.val || option.val === 0 ? option.val : '';
          html.push('<option value="' + val + '">' + option.label + '</option>');
        }
      } else {
        html.push('<option>' + option + '</option>');
      }
    }, this);

    return html.join('');
  }

});

/**
 * Radio editor
 *
 * Renders a <ul> with given options represented as <li> objects containing radio buttons
 *
 * Requires an 'options' value on the schema.
 *  Can be an array of options, a function that calls back with the array of options, a string of HTML
 *  or a Backbone collection. If a collection, the models must implement a toString() method
 */
Form.editors.Radio = Form.editors.Select.extend({

  tagName: 'ul',

  events: {
    'change input[type=radio]': function changeInputTypeRadio() {
      this.trigger('change', this);
    },
    'focus input[type=radio]': function focusInputTypeRadio() {
      if (this.hasFocus) return;
      this.trigger('focus', this);
    },
    'blur input[type=radio]': function blurInputTypeRadio() {
      if (!this.hasFocus) return;
      var self = this;
      setTimeout(function () {
        if (self.$('input[type=radio]:focus')[0]) return;
        self.trigger('blur', self);
      }, 0);
    }
  },

  getValue: function getValue() {
    return this.$('input[type=radio]:checked').val();
  },

  setValue: function setValue(value) {
    this.$('input[type=radio]').val([value]);
  },

  focus: function focus() {
    if (this.hasFocus) return;

    var checked = this.$('input[type=radio]:checked');
    if (checked[0]) {
      checked.focus();
      return;
    }

    this.$('input[type=radio]').first().focus();
  },

  blur: function blur() {
    if (!this.hasFocus) return;

    this.$('input[type=radio]:focus').blur();
  },

  /**
   * Create the radio list HTML
   * @param {Array}   Options as a simple array e.g. ['option1', 'option2']
   *                      or as an array of objects e.g. [{val: 543, label: 'Title for object 543'}]
   * @return {String} HTML
   */
  _arrayToHtml: function _arrayToHtml(array) {
    var html = [];
    var self = this;

    _.each(array, function (option, index) {
      var itemHtml = '<li>';
      if (_.isObject(option)) {
        var val = option.val || option.val === 0 ? option.val : '';
        itemHtml += '<input type="radio" name="' + self.getName() + '" value="' + val + '" id="' + self.id + '-' + index + '" />';
        itemHtml += '<label for="' + self.id + '-' + index + '">' + option.label + '</label>';
      } else {
        itemHtml += '<input type="radio" name="' + self.getName() + '" value="' + option + '" id="' + self.id + '-' + index + '" />';
        itemHtml += '<label for="' + self.id + '-' + index + '">' + option + '</label>';
      }
      itemHtml += '</li>';
      html.push(itemHtml);
    });

    return html.join('');
  }

});

/**
 * Checkboxes editor
 *
 * Renders a <ul> with given options represented as <li> objects containing checkboxes
 *
 * Requires an 'options' value on the schema.
 *  Can be an array of options, a function that calls back with the array of options, a string of HTML
 *  or a Backbone collection. If a collection, the models must implement a toString() method
 */
Form.editors.Checkboxes = Form.editors.Select.extend({

  tagName: 'ul',

  groupNumber: 0,

  events: {
    'click input[type=checkbox]': function clickInputTypeCheckbox() {
      this.trigger('change', this);
    },
    'focus input[type=checkbox]': function focusInputTypeCheckbox() {
      if (this.hasFocus) return;
      this.trigger('focus', this);
    },
    'blur input[type=checkbox]': function blurInputTypeCheckbox() {
      if (!this.hasFocus) return;
      var self = this;
      setTimeout(function () {
        if (self.$('input[type=checkbox]:focus')[0]) return;
        self.trigger('blur', self);
      }, 0);
    }
  },

  getValue: function getValue() {
    var values = [];
    this.$('input[type=checkbox]:checked').each(function () {
      values.push($(this).val());
    });
    return values;
  },

  setValue: function setValue(values) {
    if (!_.isArray(values)) values = [values];
    this.$('input[type=checkbox]').val(values);
  },

  focus: function focus() {
    if (this.hasFocus) return;

    this.$('input[type=checkbox]').first().focus();
  },

  blur: function blur() {
    if (!this.hasFocus) return;

    this.$('input[type=checkbox]:focus').blur();
  },

  /**
   * Create the checkbox list HTML
   * @param {Array}   Options as a simple array e.g. ['option1', 'option2']
   *                      or as an array of objects e.g. [{val: 543, label: 'Title for object 543'}]
   * @return {String} HTML
   */
  _arrayToHtml: function _arrayToHtml(array) {
    var html = [];
    var self = this;

    _.each(array, function (option, index) {
      var itemHtml = '<li>';
      var close = true;
      if (_.isObject(option)) {
        if (option.group) {
          var originalId = self.id;
          self.id += "-" + self.groupNumber++;
          itemHtml = '<fieldset class="group"> <legend>' + option.group + '</legend>';
          itemHtml += self._arrayToHtml(option.options);
          itemHtml += '</fieldset>';
          self.id = originalId;
          close = false;
        } else {
          var val = option.val || option.val === 0 ? option.val : '';
          itemHtml += '<input type="checkbox" name="' + self.getName() + '" value="' + val + '" id="' + self.id + '-' + index + '" />';
          itemHtml += '<label for="' + self.id + '-' + index + '">' + option.label + '</label>';
        }
      } else {
        itemHtml += '<input type="checkbox" name="' + self.getName() + '" value="' + option + '" id="' + self.id + '-' + index + '" />';
        itemHtml += '<label for="' + self.id + '-' + index + '">' + option + '</label>';
      }
      if (close) {
        itemHtml += '</li>';
      }
      html.push(itemHtml);
    });

    return html.join('');
  }

});

/**
 * Object editor
 *
 * Creates a child form. For editing Javascript objects
 *
 * @param {Object} options
 * @param {Form} options.form                 The form this editor belongs to; used to determine the constructor for the nested form
 * @param {Object} options.schema             The schema for the object
 * @param {Object} options.schema.subSchema   The schema for the nested form
 */
Form.editors.Object = Form.editors.Base.extend({
  //Prevent error classes being set on the main control; they are internally on the individual fields
  hasNestedForm: true,

  initialize: function initialize(options) {
    //Set default value for the instance so it's not a shared object
    this.value = {};

    //Init
    Form.editors.Base.prototype.initialize.call(this, options);

    //Check required options
    if (!this.form) throw new Error('Missing required option "form"');
    if (!this.schema.subSchema) throw new Error("Missing required 'schema.subSchema' option for Object editor");
  },

  render: function render() {
    //Get the constructor for creating the nested form; i.e. the same constructor as used by the parent form
    var NestedForm = this.form.constructor;

    //Create the nested form
    this.nestedForm = new NestedForm({
      schema: this.schema.subSchema,
      data: this.value,
      idPrefix: this.id + '_',
      Field: NestedForm.NestedField
    });

    this._observeFormEvents();

    this.$el.html(this.nestedForm.render().el);

    if (this.hasFocus) this.trigger('blur', this);

    return this;
  },

  getValue: function getValue() {
    if (this.nestedForm) return this.nestedForm.getValue();

    return this.value;
  },

  setValue: function setValue(value) {
    this.value = value;

    this.render();
  },

  focus: function focus() {
    if (this.hasFocus) return;

    this.nestedForm.focus();
  },

  blur: function blur() {
    if (!this.hasFocus) return;

    this.nestedForm.blur();
  },

  remove: function remove() {
    this.nestedForm.remove();

    Backbone$1.View.prototype.remove.call(this);
  },

  validate: function validate() {
    return this.nestedForm.validate();
  },

  _observeFormEvents: function _observeFormEvents() {
    if (!this.nestedForm) return;

    this.nestedForm.on('all', function () {
      // args = ["key:change", form, fieldEditor]
      var args = _.toArray(arguments);
      args[1] = this;
      // args = ["key:change", this=objectEditor, fieldEditor]

      this.trigger.apply(this, args);
    }, this);
  }

});

/**
 * NestedModel editor
 *
 * Creates a child form. For editing nested Backbone models
 *
 * Special options:
 *   schema.model:   Embedded model constructor
 */
Form.editors.NestedModel = Form.editors.Object.extend({
  initialize: function initialize(options) {
    Form.editors.Base.prototype.initialize.call(this, options);

    if (!this.form) throw new Error('Missing required option "form"');
    if (!options.schema.model) throw new Error('Missing required "schema.model" option for NestedModel editor');
  },

  render: function render() {
    //Get the constructor for creating the nested form; i.e. the same constructor as used by the parent form
    var NestedForm = this.form.constructor;

    var data = this.value || {},
        key = this.key,
        nestedModel = this.schema.model;

    //Wrap the data in a model if it isn't already a model instance
    var modelInstance = data.constructor === nestedModel ? data : new nestedModel(data);

    this.nestedForm = new NestedForm({
      model: modelInstance,
      idPrefix: this.id + '_',
      fieldTemplate: 'nestedField'
    });

    this._observeFormEvents();

    //Render form
    this.$el.html(this.nestedForm.render().el);

    if (this.hasFocus) this.trigger('blur', this);

    return this;
  },

  /**
   * Update the embedded model, checking for nested validation errors and pass them up
   * Then update the main model if all OK
   *
   * @return {Error|null} Validation error or null
   */
  commit: function commit() {
    var error = this.nestedForm.commit();
    if (error) {
      this.$el.addClass('error');
      return error;
    }

    return Form.editors.Object.prototype.commit.call(this);
  }

});

/**
 * Date editor
 *
 * Schema options
 * @param {Number|String} [options.schema.yearStart]  First year in list. Default: 100 years ago
 * @param {Number|String} [options.schema.yearEnd]    Last year in list. Default: current year
 *
 * Config options (if not set, defaults to options stored on the main Date class)
 * @param {Boolean} [options.showMonthNames]  Use month names instead of numbers. Default: true
 * @param {String[]} [options.monthNames]     Month names. Default: Full English names
 */
Form.editors.Date = Form.editors.Base.extend({

  events: {
    'change select': function changeSelect() {
      this.updateHidden();
      this.trigger('change', this);
    },
    'focus select': function focusSelect() {
      if (this.hasFocus) return;
      this.trigger('focus', this);
    },
    'blur select': function blurSelect() {
      if (!this.hasFocus) return;
      var self = this;
      setTimeout(function () {
        if (self.$('select:focus')[0]) return;
        self.trigger('blur', self);
      }, 0);
    }
  },

  initialize: function initialize(options) {
    options = options || {};

    Form.editors.Base.prototype.initialize.call(this, options);

    var Self = Form.editors.Date,
        today = new Date();

    //Option defaults
    this.options = _.extend({
      monthNames: Self.monthNames,
      showMonthNames: Self.showMonthNames
    }, options);

    //Schema defaults
    this.schema = _.extend({
      yearStart: today.getFullYear() - 100,
      yearEnd: today.getFullYear()
    }, options.schema || {});

    //Cast to Date
    if (this.value && !_.isDate(this.value)) {
      this.value = new Date(this.value);
    }

    //Set default date
    if (!this.value) {
      var date = new Date();
      date.setSeconds(0);
      date.setMilliseconds(0);

      this.value = date;
    }

    //Template
    this.template = options.template || this.constructor.template;
  },

  render: function render() {
    var options = this.options,
        schema = this.schema;

    var datesOptions = _.map(_.range(1, 32), function (date) {
      return '<option value="' + date + '">' + date + '</option>';
    });

    var monthsOptions = _.map(_.range(0, 12), function (month) {
      var value = options.showMonthNames ? options.monthNames[month] : month + 1;

      return '<option value="' + month + '">' + value + '</option>';
    });

    var yearRange = schema.yearStart < schema.yearEnd ? _.range(schema.yearStart, schema.yearEnd + 1) : _.range(schema.yearStart, schema.yearEnd - 1, -1);

    var yearsOptions = _.map(yearRange, function (year) {
      return '<option value="' + year + '">' + year + '</option>';
    });

    //Render the selects
    var $el = $($.trim(this.template({
      dates: datesOptions.join(''),
      months: monthsOptions.join(''),
      years: yearsOptions.join('')
    })));

    //Store references to selects
    this.$date = $el.find('[data-type="date"]');
    this.$month = $el.find('[data-type="month"]');
    this.$year = $el.find('[data-type="year"]');

    //Create the hidden field to store values in case POSTed to server
    this.$hidden = $('<input type="hidden" name="' + this.key + '" />');
    $el.append(this.$hidden);

    //Set value on this and hidden field
    this.setValue(this.value);

    //Remove the wrapper tag
    this.setElement($el);
    this.$el.attr('id', this.id);
    this.$el.attr('name', this.getName());

    if (this.hasFocus) this.trigger('blur', this);

    return this;
  },

  /**
   * @return {Date}   Selected date
   */
  getValue: function getValue() {
    var year = this.$year.val(),
        month = this.$month.val(),
        date = this.$date.val();

    if (!year || !month || !date) return null;

    return new Date(year, month, date);
  },

  /**
   * @param {Date} date
   */
  setValue: function setValue(date) {
    this.$date.val(date.getDate());
    this.$month.val(date.getMonth());
    this.$year.val(date.getFullYear());

    this.updateHidden();
  },

  focus: function focus() {
    if (this.hasFocus) return;

    this.$('select').first().focus();
  },

  blur: function blur() {
    if (!this.hasFocus) return;

    this.$('select:focus').blur();
  },

  /**
   * Update the hidden input which is maintained for when submitting a form
   * via a normal browser POST
   */
  updateHidden: function updateHidden() {
    var val = this.getValue();

    if (_.isDate(val)) val = val.toISOString();

    this.$hidden.val(val);
  }

}, {
  //STATICS
  template: _.template('\
    <div>\
      <select data-type="date"><%= dates %></select>\
      <select data-type="month"><%= months %></select>\
      <select data-type="year"><%= years %></select>\
    </div>\
  ', null, Form.templateSettings),

  //Whether to show month names instead of numbers
  showMonthNames: true,

  //Month names to use if showMonthNames is true
  //Replace for localisation, e.g. Form.editors.Date.monthNames = ['Janvier', 'Fevrier'...]
  monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
});

/**
 * DateTime editor
 *
 * @param {Editor} [options.DateEditor]           Date editor view to use (not definition)
 * @param {Number} [options.schema.minsInterval]  Interval between minutes. Default: 15
 */
Form.editors.DateTime = Form.editors.Base.extend({

  events: {
    'change select': function changeSelect() {
      this.updateHidden();
      this.trigger('change', this);
    },
    'focus select': function focusSelect() {
      if (this.hasFocus) return;
      this.trigger('focus', this);
    },
    'blur select': function blurSelect() {
      if (!this.hasFocus) return;
      var self = this;
      setTimeout(function () {
        if (self.$('select:focus')[0]) return;
        self.trigger('blur', self);
      }, 0);
    }
  },

  initialize: function initialize(options) {
    options = options || {};

    Form.editors.Base.prototype.initialize.call(this, options);

    //Option defaults
    this.options = _.extend({
      DateEditor: Form.editors.DateTime.DateEditor
    }, options);

    //Schema defaults
    this.schema = _.extend({
      minsInterval: 15
    }, options.schema || {});

    //Create embedded date editor
    this.dateEditor = new this.options.DateEditor(options);

    this.value = this.dateEditor.value;

    //Template
    this.template = options.template || this.constructor.template;
  },

  render: function render() {
    function pad(n) {
      return n < 10 ? '0' + n : n;
    }

    var schema = this.schema;

    //Create options
    var hoursOptions = _.map(_.range(0, 24), function (hour) {
      return '<option value="' + hour + '">' + pad(hour) + '</option>';
    });

    var minsOptions = _.map(_.range(0, 60, schema.minsInterval), function (min) {
      return '<option value="' + min + '">' + pad(min) + '</option>';
    });

    //Render time selects
    var $el = $($.trim(this.template({
      hours: hoursOptions.join(),
      mins: minsOptions.join()
    })));

    //Include the date editor
    $el.find('[data-date]').append(this.dateEditor.render().el);

    //Store references to selects
    this.$hour = $el.find('select[data-type="hour"]');
    this.$min = $el.find('select[data-type="min"]');

    //Get the hidden date field to store values in case POSTed to server
    this.$hidden = $el.find('input[type="hidden"]');

    //Set time
    this.setValue(this.value);

    this.setElement($el);
    this.$el.attr('id', this.id);
    this.$el.attr('name', this.getName());

    if (this.hasFocus) this.trigger('blur', this);

    return this;
  },

  /**
   * @return {Date}   Selected datetime
   */
  getValue: function getValue() {
    var date = this.dateEditor.getValue();

    var hour = this.$hour.val(),
        min = this.$min.val();

    if (!date || !hour || !min) return null;

    date.setHours(hour);
    date.setMinutes(min);

    return date;
  },

  /**
   * @param {Date}
   */
  setValue: function setValue(date) {
    if (!_.isDate(date)) date = new Date(date);

    this.dateEditor.setValue(date);

    this.$hour.val(date.getHours());
    this.$min.val(date.getMinutes());

    this.updateHidden();
  },

  focus: function focus() {
    if (this.hasFocus) return;

    this.$('select').first().focus();
  },

  blur: function blur() {
    if (!this.hasFocus) return;

    this.$('select:focus').blur();
  },

  /**
   * Update the hidden input which is maintained for when submitting a form
   * via a normal browser POST
   */
  updateHidden: function updateHidden() {
    var val = this.getValue();
    if (_.isDate(val)) val = val.toISOString();

    this.$hidden.val(val);
  },

  /**
   * Remove the Date editor before removing self
   */
  remove: function remove() {
    this.dateEditor.remove();

    Form.editors.Base.prototype.remove.call(this);
  }

}, {
  //STATICS
  template: _.template('\
    <div class="bbf-datetime">\
      <div class="bbf-date-container" data-date></div>\
      <select data-type="hour"><%= hours %></select>\
      :\
      <select data-type="min"><%= mins %></select>\
    </div>\
  ', null, Form.templateSettings),

  //The date editor to use (constructor function, not instance)
  DateEditor: Form.editors.Date
});

//Metadata
Form.VERSION = '0.13.0';

//Exports
Backbone$1.Form = Form;

/*
  backbone.paginator
  http://github.com/backbone-paginator/backbone.paginator

  Copyright (c) 2016 Jimmy Yuen Ho Wong and contributors

  @module
  @license MIT
*/

var _extend = _.extend;
var _omit = _.omit;
var _clone = _.clone;
var _each = _.each;
var _pick = _.pick;
var _contains = _.contains;
var _isEmpty = _.isEmpty;
var _pairs = _.pairs;
var _invert = _.invert;
var _isArray = _.isArray;
var _isFunction = _.isFunction;
var _isObject = _.isObject;
var _keys = _.keys;
var _isUndefined = _.isUndefined;
var ceil = Math.ceil;
var floor = Math.floor;
var max = Math.max;

var BBColProto = Backbone$1.Collection.prototype;

function finiteInt(val, name) {
  if (!_.isNumber(val) || _.isNaN(val) || !_.isFinite(val) || ~~val !== val) {
    throw new TypeError("`" + name + "` must be a finite integer");
  }
  return val;
}

function queryStringToParams(qs) {
  var kvp,
      k,
      v,
      ls,
      params = {},
      decode = decodeURIComponent;
  var kvps = qs.split('&');
  for (var i = 0, l = kvps.length; i < l; i++) {
    var param = kvps[i];
    kvp = param.split('='), k = kvp[0], v = kvp[1];
    if (v == null) v = true;
    k = decode(k), v = decode(v), ls = params[k];
    if (_isArray(ls)) ls.push(v);else if (ls) params[k] = [ls, v];else params[k] = v;
  }
  return params;
}

// hack to make sure the whatever event handlers for this event is run
// before func is, and the event handlers that func will trigger.
function runOnceAtLastHandler(col, event, func) {
  var eventHandlers = col._events[event];
  if (eventHandlers && eventHandlers.length) {
    var lastHandler = eventHandlers[eventHandlers.length - 1];
    var oldCallback = lastHandler.callback;
    lastHandler.callback = function () {
      try {
        oldCallback.apply(this, arguments);
        func();
      } catch (e) {
        throw e;
      } finally {
        lastHandler.callback = oldCallback;
      }
    };
  } else func();
}

var PARAM_TRIM_RE = /[\s'"]/g;
var URL_TRIM_RE = /[<>\s'"]/g;

/**
 * State change event. Fired when PageableCollection#state gets updated
 *
 * @event pageable:state:change
 * @type {object} The PageableCollection#state object of this
 * PageableCollection instance
 */

/**
   Drop-in replacement for Backbone.Collection. Supports server-side and
   client-side pagination and sorting. Client-side mode also support fully
   multi-directional synchronization of changes between pages.

   @class PageableCollection
   @extends Backbone.Collection
*/
var PageableCollection = Backbone$1.Collection.extend({

  /**
     The container object to store all pagination states.
      You can override the default state by extending this class or specifying
     them in an `options` hash to the constructor.
      @property {number} firstPage = 1 - The first page index. Set to 0 if
     your server API uses 0-based indices. You should only override this value
     during extension, initialization or reset by the server after
     fetching. This value should be read only at other times.
      @property {number} lastPage = null - The last page index. This value
     is __read only__ and it's calculated based on whether `firstPage` is 0 or
     1, during bootstrapping, fetching and resetting. Please don't change this
     value under any circumstances.
      @property {number} currentPage = null - The current page index. You
     should only override this value during extension, initialization or reset
     by the server after fetching. This value should be read only at other
     times. Can be a 0-based or 1-based index, depending on whether
     `firstPage` is 0 or 1. If left as default, it will be set to `firstPage`
     on initialization.
      @property {number} pageSize = 25 - How many records to show per
     page. This value is __read only__ after initialization, if you want to
     change the page size after initialization, you must call
     PageableCollection#setPageSize.
      @property {number} totalPages = null - How many pages there are. This
     value is __read only__ and it is calculated from `totalRecords`.
      @property {number} totalRecords = null - How many records there
     are. This value is __required__ under server mode. This value is optional
     for client mode as the number will be the same as the number of models
     during bootstrapping and during fetching, either supplied by the server
     in the metadata, or calculated from the size of the response.
      @property {string} sortKey = null - The model attribute to use for
     sorting.
      @property {number} order = -1 - The order to use for sorting. Specify
     -1 for ascending order or 1 for descending order. If 0, no client side
     sorting will be done and the order query parameter will not be sent to
     the server during a fetch.
  */
  state: {
    firstPage: 1,
    lastPage: null,
    currentPage: null,
    pageSize: 25,
    totalPages: null,
    totalRecords: null,
    sortKey: null,
    order: -1
  },

  /**
     @property {string} mode = "server" The mode of operations for this
     collection. `"server"` paginates on the server-side, `"client"` paginates
     on the client-side and `"infinite"` paginates on the server-side for APIs
     that do not support `totalRecords`.
  */
  mode: "server",

  /**
     A translation map to convert PageableCollection state attributes
     to the query parameters accepted by your server API.
      You can override the default state by extending this class or specifying
     them in `options.queryParams` object hash to the constructor.
      @property {string} currentPage = "page"
     @property {string} pageSize = "per_page"
     @property {string} totalPages = "total_pages"
     @property {string} totalRecords = "total_entries"
     @property {string} sortKey = "sort_by"
     @property {string} order = "order"
     @property {string} directions = {"-1": "asc", "1": "desc"} - A map for
     translating a PageableCollection#state.order constant to the ones your
     server API accepts.
  */
  queryParams: {
    currentPage: "page",
    pageSize: "per_page",
    totalPages: "total_pages",
    totalRecords: "total_entries",
    sortKey: "sort_by",
    order: "order",
    directions: {
      "-1": "asc",
      "1": "desc"
    }
  },

  /**
     Given a list of models or model attributues, bootstraps the full
     collection in client mode or infinite mode, or just the page you want in
     server mode.
      If you want to initialize a collection to a different state than the
     default, you can specify them in `options.state`. Any state parameters
     supplied will be merged with the default. If you want to change the
     default mapping from PageableCollection#state keys to your server API's
     query parameter names, you can specifiy an object hash in
     `option.queryParams`. Likewise, any mapping provided will be merged with
     the default. Lastly, all Backbone.Collection constructor options are also
     accepted.
      See:
      - PageableCollection#state
     - PageableCollection#queryParams
     - [Backbone.Collection#initialize](http://backbonejs.org/#Collection-constructor)
      @constructor
      @property {Backbone.Collection} fullCollection - __CLIENT MODE ONLY__
     This collection is the internal storage for the bootstrapped or fetched
     models. You can use this if you want to operate on all the pages.
      @param {Array.<Object>} models
      @param {Object} options
      @param {function(*, *): number} options.comparator - If specified, this
     comparator is set to the current page under server mode, or the
     PageableCollection#fullCollection otherwise.
      @param {boolean} options.full 0 If `false` and either a
     `options.comparator` or `sortKey` is defined, the comparator is attached
     to the current page. Default is `true` under client or infinite mode and
     the comparator will be attached to the PageableCollection#fullCollection.
      @param {Object} options.state - The state attributes overriding the defaults.
      @param {string} options.state.sortKey - The model attribute to use for
     sorting. If specified instead of `options.comparator`, a comparator will
     be automatically created using this value, and optionally a sorting order
     specified in `options.state.order`. The comparator is then attached to
     the new collection instance.
      @param {number} options.state.order - The order to use for sorting. Specify
     -1 for ascending order and 1 for descending order.
      @param {Object} options.queryParam
  */
  constructor: function constructor(models, options) {

    BBColProto.constructor.apply(this, arguments);

    options = options || {};

    var mode = this.mode = options.mode || this.mode || PageableProto.mode;

    var queryParams = _extend({}, PageableProto.queryParams, this.queryParams, options.queryParams || {});

    queryParams.directions = _extend({}, PageableProto.queryParams.directions, this.queryParams.directions, queryParams.directions);

    this.queryParams = queryParams;

    var state = this.state = _extend({}, PageableProto.state, this.state, options.state);

    state.currentPage = state.currentPage == null ? state.firstPage : state.currentPage;

    if (!_isArray(models)) models = models ? [models] : [];
    models = models.slice();

    if (mode != "server" && state.totalRecords == null && !_isEmpty(models)) {
      state.totalRecords = models.length;
    }

    this.switchMode(mode, _extend({
      fetch: false,
      resetState: false,
      models: models
    }, options));

    var comparator = options.comparator;

    if (state.sortKey && !comparator) {
      this.setSorting(state.sortKey, state.order, options);
    }

    if (mode != "server") {
      var fullCollection = this.fullCollection;

      if (comparator && options.full) {
        this.comparator = null;
        fullCollection.comparator = comparator;
      }

      if (options.full) fullCollection.sort();

      // make sure the models in the current page and full collection have the
      // same references
      if (!_isEmpty(models)) {
        this.reset(models, _extend({
          silent: true
        }, options));
        this.getPage(state.currentPage);
        models.splice.apply(models, [0, models.length].concat(this.models));
      }
    }

    this._initState = _clone(this.state);
  },

  /**
     Makes a Backbone.Collection that contains all the pages.
      @private
     @param {Array.<Object|Backbone.Model>} models
     @param {Object} options Options for Backbone.Collection constructor.
     @return {Backbone.Collection}
  */
  _makeFullCollection: function _makeFullCollection(models, options) {

    var properties = ["url", "model", "sync", "comparator"];
    var thisProto = this.constructor.prototype;
    var i, length, prop;

    var proto = {};
    for (i = 0, length = properties.length; i < length; i++) {
      prop = properties[i];
      if (!_isUndefined(thisProto[prop])) {
        proto[prop] = thisProto[prop];
      }
    }

    var fullCollection = new (Backbone$1.Collection.extend(proto))(models, options);

    for (i = 0, length = properties.length; i < length; i++) {
      prop = properties[i];
      if (this[prop] !== thisProto[prop]) {
        fullCollection[prop] = this[prop];
      }
    }

    return fullCollection;
  },

  /**
     Factory method that returns a Backbone event handler that responses to
     the `add`, `remove`, `reset`, and the `sort` events. The returned event
     handler will synchronize the current page collection and the full
     collection's models.
      @private
      @fires PageableCollection#pageable:state:change when handling an
     `add`, `remove`, or `reset` event
      @param {PageableCollection} pageCol
     @param {Backbone.Collection} fullCol
      @return {function(string, Backbone.Model, Backbone.Collection, Object)}
     Collection event handler
  */
  _makeCollectionEventHandler: function _makeCollectionEventHandler(pageCol, fullCol) {

    return function collectionEventHandler(event, model, collection, options) {

      var handlers = pageCol._handlers;
      _each(_keys(handlers), function (event) {
        var handler = handlers[event];
        pageCol.off(event, handler);
        fullCol.off(event, handler);
      });

      var state = _clone(pageCol.state);
      var firstPage = state.firstPage;
      var currentPage = firstPage === 0 ? state.currentPage : state.currentPage - 1;
      var pageSize = state.pageSize;
      var pageStart = currentPage * pageSize,
          pageEnd = pageStart + pageSize;

      if (event == "add") {
        var pageIndex,
            fullIndex,
            addAt,
            colToAdd,
            options = options || {};
        if (collection == fullCol) {
          fullIndex = fullCol.indexOf(model);
          if (fullIndex >= pageStart && fullIndex < pageEnd) {
            colToAdd = pageCol;
            pageIndex = addAt = fullIndex - pageStart;
          }
        } else {
          pageIndex = pageCol.indexOf(model);
          fullIndex = pageStart + pageIndex;
          colToAdd = fullCol;
          var addAt = !_isUndefined(options.at) ? options.at + pageStart : fullIndex;
        }

        if (!options.onRemove) {
          ++state.totalRecords;
          delete options.onRemove;
        }

        pageCol.state = pageCol._checkState(state);

        if (colToAdd) {
          colToAdd.add(model, _extend({}, options, {
            at: addAt
          }));
          var modelToRemove = pageIndex >= pageSize ? model : !_isUndefined(options.at) && addAt < pageEnd && pageCol.length > pageSize ? pageCol.at(pageSize) : null;
          if (modelToRemove) {
            runOnceAtLastHandler(collection, event, function () {
              pageCol.remove(modelToRemove, {
                onAdd: true
              });
            });
          }
        }

        if (!options.silent) pageCol.trigger("pageable:state:change", pageCol.state);
      }

      // remove the model from the other collection as well
      if (event == "remove") {
        if (!options.onAdd) {
          // decrement totalRecords and update totalPages and lastPage
          if (! --state.totalRecords) {
            state.totalRecords = null;
            state.totalPages = null;
          } else {
            var totalPages = state.totalPages = ceil(state.totalRecords / pageSize);
            state.lastPage = firstPage === 0 ? totalPages - 1 : totalPages || firstPage;
            if (state.currentPage > totalPages) state.currentPage = state.lastPage;
          }
          pageCol.state = pageCol._checkState(state);

          var nextModel,
              removedIndex = options.index;
          if (collection == pageCol) {
            if (nextModel = fullCol.at(pageEnd)) {
              runOnceAtLastHandler(pageCol, event, function () {
                pageCol.push(nextModel, {
                  onRemove: true
                });
              });
            } else if (!pageCol.length && state.totalRecords) {
              pageCol.reset(fullCol.models.slice(pageStart - pageSize, pageEnd - pageSize), _extend({}, options, {
                parse: false
              }));
            }
            fullCol.remove(model);
          } else if (removedIndex >= pageStart && removedIndex < pageEnd) {
            if (nextModel = fullCol.at(pageEnd - 1)) {
              runOnceAtLastHandler(pageCol, event, function () {
                pageCol.push(nextModel, {
                  onRemove: true
                });
              });
            }
            pageCol.remove(model);
            if (!pageCol.length && state.totalRecords) {
              pageCol.reset(fullCol.models.slice(pageStart - pageSize, pageEnd - pageSize), _extend({}, options, {
                parse: false
              }));
            }
          }
        } else delete options.onAdd;

        if (!options.silent) pageCol.trigger("pageable:state:change", pageCol.state);
      }

      if (event == "reset") {
        options = collection;
        collection = model;

        // Reset that's not a result of getPage
        if (collection == pageCol && options.from == null && options.to == null) {
          var head = fullCol.models.slice(0, pageStart);
          var tail = fullCol.models.slice(pageStart + pageCol.models.length);
          fullCol.reset(head.concat(pageCol.models).concat(tail), options);
        } else if (collection == fullCol) {
          if (!(state.totalRecords = fullCol.models.length)) {
            state.totalRecords = null;
            state.totalPages = null;
          }
          if (pageCol.mode == "client") {
            firstPage = state.lastPage = state.currentPage = state.firstPage;
            currentPage = firstPage === 0 ? state.currentPage : state.currentPage - 1;
            pageStart = currentPage * pageSize;
            pageEnd = pageStart + pageSize;
          }
          pageCol.state = pageCol._checkState(state);
          pageCol.reset(fullCol.models.slice(pageStart, pageEnd), _extend({}, options, {
            parse: false
          }));
        }

        if (!options.silent) pageCol.trigger("pageable:state:change", pageCol.state);
      }

      if (event == "sort") {
        options = collection;
        collection = model;
        if (collection === fullCol) {
          pageCol.reset(fullCol.models.slice(pageStart, pageEnd), _extend({}, options, {
            parse: false
          }));
        }
      }

      _each(_keys(handlers), function (event) {
        var handler = handlers[event];
        _each([pageCol, fullCol], function (col) {
          col.on(event, handler);
          var callbacks = col._events[event] || [];
          callbacks.unshift(callbacks.pop());
        });
      });
    };
  },

  /**
     Sanity check this collection's pagination states. Only perform checks
     when all the required pagination state values are defined and not null.
     If `totalPages` is undefined or null, it is set to `totalRecords` /
     `pageSize`. `lastPage` is set according to whether `firstPage` is 0 or 1
     when no error occurs.
      @private
      @throws {TypeError} If `totalRecords`, `pageSize`, `currentPage` or
     `firstPage` is not a finite integer.
      @throws {RangeError} If `pageSize`, `currentPage` or `firstPage` is out
     of bounds.
      @return {Object} Returns the `state` object if no error was found.
  */
  _checkState: function _checkState(state) {
    var mode = this.mode;
    var links = this.links;
    var totalRecords = state.totalRecords;
    var pageSize = state.pageSize;
    var currentPage = state.currentPage;
    var firstPage = state.firstPage;
    var totalPages = state.totalPages;

    if (totalRecords != null && pageSize != null && currentPage != null && firstPage != null && (mode == "infinite" ? links : true)) {

      totalRecords = finiteInt(totalRecords, "totalRecords");
      pageSize = finiteInt(pageSize, "pageSize");
      currentPage = finiteInt(currentPage, "currentPage");
      firstPage = finiteInt(firstPage, "firstPage");

      if (pageSize < 1) {
        throw new RangeError("`pageSize` must be >= 1");
      }

      totalPages = state.totalPages = ceil(totalRecords / pageSize);

      if (firstPage < 0 || firstPage > 1) {
        throw new RangeError("`firstPage must be 0 or 1`");
      }

      state.lastPage = firstPage === 0 ? max(0, totalPages - 1) : totalPages || firstPage;

      if (mode == "infinite") {
        if (!links[currentPage + '']) {
          throw new RangeError("No link found for page " + currentPage);
        }
      } else if (currentPage < firstPage || totalPages > 0 && (firstPage ? currentPage > totalPages : currentPage >= totalPages)) {
        throw new RangeError("`currentPage` must be firstPage <= currentPage " + (firstPage ? "<" : "<=") + " totalPages if " + firstPage + "-based. Got " + currentPage + '.');
      }
    }

    return state;
  },

  /**
     Change the page size of this collection.
      Under most if not all circumstances, you should call this method to
     change the page size of a pageable collection because it will keep the
     pagination state sane. By default, the method will recalculate the
     current page number to one that will retain the current page's models
     when increasing the page size. When decreasing the page size, this method
     will retain the last models to the current page that will fit into the
     smaller page size.
      If `options.first` is true, changing the page size will also reset the
     current page back to the first page instead of trying to be smart.
      For server mode operations, changing the page size will trigger a
     PageableCollection#fetch and subsequently a `reset` event.
      For client mode operations, changing the page size will `reset` the
     current page by recalculating the current page boundary on the client
     side.
      If `options.fetch` is true, a fetch can be forced if the collection is in
     client mode.
      @param {number} pageSize - The new page size to set to PageableCollection#state.
     @param {Object} options - {@link PageableCollection#fetch} options.
     @param {boolean} options.first = false 0 Reset the current page number to
     the first page if `true`.
     @param {boolean} options.fetch - If `true`, force a fetch in client mode.
      @throws {TypeError} If `pageSize` is not a finite integer.
     @throws {RangeError} If `pageSize` is less than 1.
      @chainable
     @return {XMLHttpRequest|PageableCollection} The XMLHttpRequest
     from fetch or this.
  */
  setPageSize: function setPageSize(pageSize, options) {
    pageSize = finiteInt(pageSize, "pageSize");

    options = options || {
      first: false
    };

    var state = this.state;
    var totalPages = ceil(state.totalRecords / pageSize);
    var currentPage = totalPages ? max(state.firstPage, floor(totalPages * state.currentPage / state.totalPages)) : state.firstPage;

    state = this.state = this._checkState(_extend({}, state, {
      pageSize: pageSize,
      currentPage: options.first ? state.firstPage : currentPage,
      totalPages: totalPages
    }));

    return this.getPage(state.currentPage, _omit(options, ["first"]));
  },

  /**
     Switching between client, server and infinite mode.
      If switching from client to server mode, the #fullCollection is emptied
     first and then deleted and a fetch is immediately issued for the current
     page from the server. Pass `false` to `options.fetch` to skip fetching.
      If switching to infinite mode, and if `options.models` is given for an
     array of models,PageableCollection#links will be populated with a URL per
     page, using the default URL for this collection.
      If switching from server to client mode, all of the pages are immediately
     refetched. If you have too many pages, you can pass `false` to
     `options.fetch` to skip fetching.
      If switching to any mode from infinite mode, thePageableCollection#links
     will be deleted.
      @fires PageableCollection#pageable:state:change
      @param {"server"|"client"|"infinite"} mode - The mode to switch to.
      @param {Object} options
      @param {boolean} options.fetch = true - If `false`, no fetching is done.
      @param {boolean} options.resetState = true - If 'false', the state is not
     reset, but checked for sanity instead.
      @chainable
     @return {XMLHttpRequest|PageableCollection} The XMLHttpRequest
     from fetch or this if `options.fetch` is `false`.
  */
  switchMode: function switchMode(mode, options) {

    if (!_contains(["server", "client", "infinite"], mode)) {
      throw new TypeError('`mode` must be one of "server", "client" or "infinite"');
    }

    options = options || {
      fetch: true,
      resetState: true
    };

    var state = this.state = options.resetState ? _clone(this._initState) : this._checkState(_extend({}, this.state));

    this.mode = mode;

    var self = this;
    var fullCollection = this.fullCollection;
    var handlers = this._handlers = this._handlers || {},
        handler;
    if (mode != "server" && !fullCollection) {
      fullCollection = this._makeFullCollection(options.models || [], options);
      fullCollection.pageableCollection = this;
      this.fullCollection = fullCollection;
      var allHandler = this._makeCollectionEventHandler(this, fullCollection);
      _each(["add", "remove", "reset", "sort"], function (event) {
        handlers[event] = handler = _.bind(allHandler, {}, event);
        self.on(event, handler);
        fullCollection.on(event, handler);
      });
      fullCollection.comparator = this._fullComparator;
    } else if (mode == "server" && fullCollection) {
      _each(_keys(handlers), function (event) {
        handler = handlers[event];
        self.off(event, handler);
        fullCollection.off(event, handler);
      });
      delete this._handlers;
      this._fullComparator = fullCollection.comparator;
      delete this.fullCollection;
    }

    if (mode == "infinite") {
      var links = this.links = {};
      var firstPage = state.firstPage;
      var totalPages = ceil(state.totalRecords / state.pageSize);
      var lastPage = firstPage === 0 ? max(0, totalPages - 1) : totalPages || firstPage;
      for (var i = state.firstPage; i <= lastPage; i++) {
        links[i] = this.url;
      }
    } else if (this.links) delete this.links;

    if (!options.silent) this.trigger("pageable:state:change", state);

    return options.fetch ? this.fetch(_omit(options, "fetch", "resetState")) : this;
  },

  /**
     @return {boolean} `true` if this collection can page backward, `false`
     otherwise.
  */
  hasPreviousPage: function hasPreviousPage() {
    var state = this.state;
    var currentPage = state.currentPage;
    if (this.mode != "infinite") return currentPage > state.firstPage;
    return !!this.links[currentPage - 1];
  },

  /**
     @return {boolean} `true` if this collection can page forward, `false`
     otherwise.
  */
  hasNextPage: function hasNextPage() {
    var state = this.state;
    var currentPage = this.state.currentPage;
    if (this.mode != "infinite") return currentPage < state.lastPage;
    return !!this.links[currentPage + 1];
  },

  /**
     Fetch the first page in server mode, or reset the current page of this
     collection to the first page in client or infinite mode.
      @param {Object} options {@linkPageableCollection#getPage} options.
      @chainable
     @return {XMLHttpRequest|PageableCollection} The XMLHttpRequest
     from fetch or this.
  */
  getFirstPage: function getFirstPage(options) {
    return this.getPage("first", options);
  },

  /**
     Fetch the previous page in server mode, or reset the current page of this
     collection to the previous page in client or infinite mode.
      @param {Object} options {@linkPageableCollection#getPage} options.
      @chainable
     @return {XMLHttpRequest|PageableCollection} The XMLHttpRequest
     from fetch or this.
  */
  getPreviousPage: function getPreviousPage(options) {
    return this.getPage("prev", options);
  },

  /**
     Fetch the next page in server mode, or reset the current page of this
     collection to the next page in client mode.
      @param {Object} options {@linkPageableCollection#getPage} options.
      @chainable
     @return {XMLHttpRequest|PageableCollection} The XMLHttpRequest
     from fetch or this.
  */
  getNextPage: function getNextPage(options) {
    return this.getPage("next", options);
  },

  /**
     Fetch the last page in server mode, or reset the current page of this
     collection to the last page in client mode.
      @param {Object} options {@linkPageableCollection#getPage} options.
      @chainable
     @return {XMLHttpRequest|PageableCollection} The XMLHttpRequest
     from fetch or this.
  */
  getLastPage: function getLastPage(options) {
    return this.getPage("last", options);
  },

  /**
     Given a page index, set PageableCollection#state.currentPage to that
     index. If this collection is in server mode, fetch the page using the
     updated state, otherwise, reset the current page of this collection to
     the page specified by `index` in client mode. If `options.fetch` is true,
     a fetch can be forced in client mode before resetting the current
     page. Under infinite mode, if the index is less than the current page, a
     reset is done as in client mode. If the index is greater than the current
     page number, a fetch is made with the results **appended**
     toPageableCollection#fullCollection.  The current page will then be reset
     after fetching.
      @fires PageableCollection#pageable:state:change
      @param {number|string} index - The page index to go to, or the page name to
     look up fromPageableCollection#links in infinite mode.
     @param {Object} options - {@linkPageableCollection#fetch} options or
     [reset](http://backbonejs.org/#Collection-reset) options for client mode
     when `options.fetch` is `false`.
     @param {boolean} options.fetch = false - If true, force a
     {@linkPageableCollection#fetch} in client mode.
      @throws {TypeError} If `index` is not a finite integer under server or
     client mode, or does not yield a URL fromPageableCollection#links under
     infinite mode.
      @throws {RangeError} If `index` is out of bounds.
      @chainable
     @return {XMLHttpRequest|PageableCollection} The XMLHttpRequest
     from fetch or this.
  */
  getPage: function getPage(index, options) {

    var mode = this.mode,
        fullCollection = this.fullCollection;

    options = options || {
      fetch: false
    };

    var state = this.state,
        firstPage = state.firstPage,
        currentPage = state.currentPage,
        lastPage = state.lastPage,
        pageSize = state.pageSize;

    var pageNum = index;
    switch (index) {
      case "first":
        pageNum = firstPage;
        break;
      case "prev":
        pageNum = currentPage - 1;
        break;
      case "next":
        pageNum = currentPage + 1;
        break;
      case "last":
        pageNum = lastPage;
        break;
      default:
        pageNum = finiteInt(index, "index");
    }

    this.state = this._checkState(_extend({}, state, {
      currentPage: pageNum
    }));
    if (!options.silent) this.trigger("pageable:state:change", this.state);

    options.from = currentPage, options.to = pageNum;

    var pageStart = (firstPage === 0 ? pageNum : pageNum - 1) * pageSize;
    var pageModels = fullCollection && fullCollection.length ? fullCollection.models.slice(pageStart, pageStart + pageSize) : [];
    if ((mode == "client" || mode == "infinite" && !_isEmpty(pageModels)) && !options.fetch) {
      this.reset(pageModels, _omit(options, "fetch"));
      return this;
    }

    if (mode == "infinite") options.url = this.links[pageNum];

    return this.fetch(_omit(options, "fetch"));
  },

  /**
     Fetch the page for the provided item offset in server mode, or reset the
     current page of this collection to the page for the provided item offset
     in client mode.
      @param {Object} options {@linkPageableCollection#getPage} options.
      @chainable
     @return {XMLHttpRequest|PageableCollection} The XMLHttpRequest
     from fetch or this.
  */
  getPageByOffset: function getPageByOffset(offset, options) {
    if (offset < 0) {
      throw new RangeError("`offset must be > 0`");
    }
    offset = finiteInt(offset);

    var page = floor(offset / this.state.pageSize);
    if (this.state.firstPage !== 0) page++;
    if (page > this.state.lastPage) page = this.state.lastPage;
    return this.getPage(page, options);
  },

  /**
     Overidden to make `getPage` compatible with Zepto.
      @param {string} method
     @param {Backbone.Model|Backbone.Collection} model
     @param {Object} options
      @return {XMLHttpRequest}
  */
  sync: function sync(method, model, options) {
    var self = this;
    if (self.mode == "infinite") {
      var success = options.success;
      var currentPage = self.state.currentPage;
      options.success = function (resp, status, xhr) {
        var links = self.links;
        var newLinks = self.parseLinks(resp, _extend({
          xhr: xhr
        }, options));
        if (newLinks.first) links[self.state.firstPage] = newLinks.first;
        if (newLinks.prev) links[currentPage - 1] = newLinks.prev;
        if (newLinks.next) links[currentPage + 1] = newLinks.next;
        if (success) success(resp, status, xhr);
      };
    }

    return (BBColProto.sync || Backbone$1.sync).call(self, method, model, options);
  },

  /**
     Parse pagination links from the server response. Only valid under
     infinite mode.
      Given a response body and a XMLHttpRequest object, extract pagination
     links from them for infinite paging.
      This default implementation parses the RFC 5988 `Link` header and extract
     3 links from it - `first`, `prev`, `next`. Any subclasses overriding this
     method __must__ return an object hash having only the keys
     above. However, simply returning a `next` link or an empty hash if there
     are no more links should be enough for most implementations.
      @param {*} resp The deserialized response body.
     @param {Object} options
     @param {XMLHttpRequest} options.xhr - The XMLHttpRequest object for this
     response.
     @return {Object}
  */
  parseLinks: function parseLinks(resp, options) {
    var links = {};
    var linkHeader = options.xhr.getResponseHeader("Link");
    if (linkHeader) {
      var relations = ["first", "prev", "next"];
      _each(linkHeader.split(","), function (linkValue) {
        var linkParts = linkValue.split(";");
        var url = linkParts[0].replace(URL_TRIM_RE, '');
        var params = linkParts.slice(1);
        _each(params, function (param) {
          var paramParts = param.split("=");
          var key = paramParts[0].replace(PARAM_TRIM_RE, '');
          var value = paramParts[1].replace(PARAM_TRIM_RE, '');
          if (key == "rel" && _contains(relations, value)) links[value] = url;
        });
      });
    }

    return links;
  },

  /**
     Parse server response data.
      This default implementation assumes the response data is in one of two
     structures:
          [
           {}, // Your new pagination state
           [{}, ...] // An array of JSON objects
         ]
      Or,
          [{}] // An array of JSON objects
      The first structure is the preferred form because the pagination states
     may have been updated on the server side, sending them down again allows
     this collection to update its states. If the response has a pagination
     state object, it is checked for errors.
      The second structure is the
     [Backbone.Collection#parse](http://backbonejs.org/#Collection-parse)
     default.
      **Note:** this method has been further simplified since 1.1.7. While
     existingPageableCollection#parse implementations will continue to work,
     new code is encouraged to overridePageableCollection#parseState
     andPageableCollection#parseRecords instead.
      @param {Object} resp The deserialized response data from the server.
     @param {Object} the options for the ajax request
      @return {Array.<Object>} An array of model objects
  */
  parse: function parse(resp, options) {
    var newState = this.parseState(resp, _clone(this.queryParams), _clone(this.state), options);
    if (newState) this.state = this._checkState(_extend({}, this.state, newState));
    return this.parseRecords(resp, options);
  },

  /**
     Parse server response for server pagination state updates. Not applicable
     under infinite mode.
      This default implementation first checks whether the response has any
     state object as documented inPageableCollection#parse. If it exists, a
     state object is returned by mapping the server state keys to this
     pageable collection instance's query parameter keys using `queryParams`.
      It is __NOT__ neccessary to return a full state object complete with all
     the mappings defined inPageableCollection#queryParams. Any state object
     resulted is merged with a copy of the current pageable collection state
     and checked for sanity before actually updating. Most of the time, simply
     providing a new `totalRecords` value is enough to trigger a full
     pagination state recalculation.
          parseState: function (resp, queryParams, state, options) {
           return {totalRecords: resp.total_entries};
         }
      If you want to use header fields use:
          parseState: function (resp, queryParams, state, options) {
             return {totalRecords: options.xhr.getResponseHeader("X-total")};
         }
      This method __MUST__ return a new state object instead of directly
     modifying the PageableCollection#state object. The behavior of directly
     modifying PageableCollection#state is undefined.
      @param {Object} resp - The deserialized response data from the server.
     @param {Object} queryParams - A copy of PageableCollection#queryParams.
     @param {Object} state - A copy of PageableCollection#state.
     @param {Object} options - The options passed through from
     `parse`. (backbone >= 0.9.10 only)
      @return {Object} A new (partial) state object.
   */
  parseState: function parseState(resp, queryParams, state, options) {
    if (resp && resp.length === 2 && _isObject(resp[0]) && _isArray(resp[1])) {

      var newState = _clone(state);
      var serverState = resp[0];

      _each(_pairs(_omit(queryParams, "directions")), function (kvp) {
        var k = kvp[0],
            v = kvp[1];
        var serverVal = serverState[v];
        if (!_isUndefined(serverVal) && !_.isNull(serverVal)) newState[k] = serverState[v];
      });

      if (serverState.order) {
        newState.order = _invert(queryParams.directions)[serverState.order] * 1;
      }

      return newState;
    }
  },

  /**
     Parse server response for an array of model objects.
      This default implementation first checks whether the response has any
     state object as documented inPageableCollection#parse. If it exists, the
     array of model objects is assumed to be the second element, otherwise the
     entire response is returned directly.
      @param {Object} resp - The deserialized response data from the server.
     @param {Object} options - The options passed through from the
     `parse`. (backbone >= 0.9.10 only)
      @return {Array.<Object>} An array of model objects
   */
  parseRecords: function parseRecords(resp, options) {
    if (resp && resp.length === 2 && _isObject(resp[0]) && _isArray(resp[1])) {
      return resp[1];
    }

    return resp;
  },

  /**
     Fetch a page from the server in server mode, or all the pages in client
     mode. Under infinite mode, the current page is refetched by default and
     then reset.
      The query string is constructed by translating the current pagination
     state to your server API query parameter
     usingPageableCollection#queryParams. The current page will reset after
     fetch.
      @param {Object} options - Accepts all
     [Backbone.Collection#fetch](http://backbonejs.org/#Collection-fetch)
     options.
      @return {XMLHttpRequest}
  */
  fetch: function fetch(options) {

    options = options || {};

    var state = this._checkState(this.state);

    var mode = this.mode;

    if (mode == "infinite" && !options.url) {
      options.url = this.links[state.currentPage];
    }

    var data = options.data || {};

    // dedup query params
    var url = options.url || this.url || "";
    if (_isFunction(url)) url = url.call(this);
    var qsi = url.indexOf('?');
    if (qsi != -1) {
      _extend(data, queryStringToParams(url.slice(qsi + 1)));
      url = url.slice(0, qsi);
    }

    options.url = url;
    options.data = data;

    // map params except directions
    var queryParams = this.mode == "client" ? _pick(this.queryParams, "sortKey", "order") : _omit(_pick(this.queryParams, _keys(PageableProto.queryParams)), "directions");

    var thisCopy = _.clone(this);
    _.each(queryParams, function (v, k) {
      v = _isFunction(v) ? v.call(thisCopy) : v;
      if (state[k] != null && v != null && _.isUndefined(data[v])) {
        data[v] = state[k];
      }
    }, this);

    // fix up sorting parameters
    var i;
    if (state.sortKey && state.order) {
      var o = _isFunction(queryParams.order) ? queryParams.order.call(thisCopy) : queryParams.order;
      if (!_isArray(state.order)) {
        data[o] = this.queryParams.directions[state.order + ""];
      } else {
        data[o] = [];
        for (i = 0; i < state.order.length; i += 1) {
          data[o].push(this.queryParams.directions[state.order[i]]);
        }
      }
    } else if (!state.sortKey) delete data[queryParams.order];

    // map extra query parameters
    var extraKvps = _pairs(_omit(this.queryParams, _keys(PageableProto.queryParams))),
        kvp,
        v;
    for (i = 0; i < extraKvps.length; i++) {
      kvp = extraKvps[i];
      v = kvp[1];
      v = _isFunction(v) ? v.call(thisCopy) : v;
      if (v != null) data[kvp[0]] = v;
    }

    if (mode != "server") {
      var self = this,
          fullCol = this.fullCollection;
      var success = options.success;
      options.success = function (col, resp, opts) {

        // make sure the caller's intent is obeyed
        opts = opts || {};
        if (_isUndefined(options.silent)) delete opts.silent;else opts.silent = options.silent;

        var models = col.models;
        if (mode == "client") fullCol.reset(models, opts);else {
          fullCol.add(models, _extend({
            at: fullCol.length
          }, _extend(opts, {
            parse: false
          })));
          self.trigger("reset", self, opts);
        }

        if (success) success(col, resp, opts);
      };

      // silent the first reset from backbone
      return BBColProto.fetch.call(this, _extend({}, options, {
        silent: true
      }));
    }

    return BBColProto.fetch.call(this, options);
  },

  /**
     Convenient method for making a `comparator` sorted by a model attribute
     identified by `sortKey` and ordered by `order`.
      Like a Backbone.Collection, a PageableCollection will maintain the
     __current page__ in sorted order on the client side if a `comparator` is
     attached to it. If the collection is in client mode, you can attach a
     comparator toPageableCollection#fullCollection to have all the pages
     reflect the global sorting order by specifying an option `full` to
     `true`. You __must__ call `sort` manually
     orPageableCollection#fullCollection.sort after calling this method to
     force a resort.
      While you can use this method to sort the current page in server mode,
     the sorting order may not reflect the global sorting order due to the
     additions or removals of the records on the server since the last
     fetch. If you want the most updated page in a global sorting order, it is
     recommended that you set PageableCollection#state.sortKey and optionally
     PageableCollection#state.order, and then callPageableCollection#fetch.
      @protected
      @param {string} sortKey = this.state.sortKey - See `state.sortKey`.
     @param {number} order = this.state.order - See `state.order`.
     @param {(function(Backbone.Model, string): Object) | string} sortValue -
     See PageableCollection#setSorting.
      See [Backbone.Collection.comparator](http://backbonejs.org/#Collection-comparator).
  */
  _makeComparator: function _makeComparator(sortKey, order, sortValue) {
    var state = this.state;

    sortKey = sortKey || state.sortKey;
    order = order || state.order;

    if (!sortKey || !order) return;

    if (!sortValue) sortValue = function sortValue(model, attr) {
      return model.get(attr);
    };

    return function (left, right) {
      var l = sortValue(left, sortKey),
          r = sortValue(right, sortKey),
          t;
      if (order === 1) t = l, l = r, r = t;
      if (l === r) return 0;else if (l < r) return -1;
      return 1;
    };
  },

  /**
     Adjusts the sorting for this pageable collection.
      Given a `sortKey` and an `order`, sets `state.sortKey` and
     `state.order`. A comparator can be applied on the client side to sort in
     the order defined if `options.side` is `"client"`. By default the
     comparator is applied to thePageableCollection#fullCollection. Set
     `options.full` to `false` to apply a comparator to the current page under
     any mode. Setting `sortKey` to `null` removes the comparator from both
     the current page and the full collection.
      If a `sortValue` function is given, it will be passed the `(model,
     sortKey)` arguments and is used to extract a value from the model during
     comparison sorts. If `sortValue` is not given, `model.get(sortKey)` is
     used for sorting.
      @chainable
      @param {string} sortKey - See `state.sortKey`.
     @param {number} order=this.state.order - See `state.order`.
     @param {Object} options
     @param {string} options.side - By default, `"client"` if `mode` is
     `"client"`, `"server"` otherwise.
     @param {boolean} options.full = true
     @param {(function(Backbone.Model, string): Object) | string} options.sortValue
  */
  setSorting: function setSorting(sortKey, order, options) {

    var state = this.state;

    state.sortKey = sortKey;
    state.order = order = order || state.order;

    var fullCollection = this.fullCollection;

    var delComp = false,
        delFullComp = false;

    if (!sortKey) delComp = delFullComp = true;

    var mode = this.mode;
    options = _extend({
      side: mode == "client" ? mode : "server",
      full: true
    }, options);

    var comparator = this._makeComparator(sortKey, order, options.sortValue);

    var full = options.full,
        side = options.side;

    if (side == "client") {
      if (full) {
        if (fullCollection) fullCollection.comparator = comparator;
        delComp = true;
      } else {
        this.comparator = comparator;
        delFullComp = true;
      }
    } else if (side == "server" && !full) {
      this.comparator = comparator;
    }

    if (delComp) this.comparator = null;
    if (delFullComp && fullCollection) fullCollection.comparator = null;

    return this;
  }

});

var PageableProto = PageableCollection.prototype;

if (Backbone$1.PageableCollection !== undefined) {
  var oldPageableCollection = Backbone$1.PageableCollection;
  /**
     __BROWSER ONLY__
     If you already have an object named `PageableCollection` attached to the
     `Backbone` module, you can use this to return a local reference to this
     PageableCollection class and reset the name PageableCollection to its
     previous definition.
         // The left hand side gives you a reference to this
         // PageableCollection implementation, the right hand side
         // resets PageableCollection to your other PageableCollection.
         var PageableCollection = PageableCollection.noConflict();
     @static
     @return {PageableCollection}
  */
  Backbone$1.PageableCollection.noConflict = function () {
    Backbone$1.PageableCollection = oldPageableCollection;
    return PageableCollection;
  };
}

Backbone$1.PageableCollection = PageableCollection;

exports.Backbone = Backbone$1;
exports['default'] = Backbone$1;

Object.defineProperty(exports, '__esModule', { value: true });

})));
