var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('transceiver'), require('blessed'), require('dateformat'), require('json-prune'), require('path'), require('app-root-path'), require('shortid'), require('stack-trace')) : typeof define === 'function' && define.amd ? define(['transceiver', 'blessed', 'dateformat', 'json-prune', 'path', 'app-root-path', 'shortid', 'stack-trace'], factory) : global.investigator = factory(global.transceiver, global.blessed, global.dateFormat, global.prune, global.path, global.appRoot, global.shortid, global.stack_trace);
})(this, function (transceiver, blessed, dateFormat, _prune, path, appRoot, shortid, stack_trace) {
  'use strict';

  var LogsList = (function () {
    function LogsList() {
      var _this = this;

      _classCallCheck(this, LogsList);

      this.selectedLog = null;
      this.logs = {};
      this.logsCount = 0;
      this.channel = transceiver.channel('log');
      this.autoScroll = true;
      this.element = blessed.list({
        top: '0',
        left: '0',
        bottom: 7,
        tags: true,
        keys: true,
        mouse: true,
        scrollbar: {
          bg: 'magenta'
        },
        style: {
          selected: {
            fg: 'black',
            bg: 'white'
          }
        }
      });

      this.element.key(['up', 'down', 's', 'b'], function (ch, key) {
        if (key.name === 's') {
          _this.autoScroll = !_this.autoScroll;
        } else if (key.name === 'b') {
          _this.scrollToBottom();
          transceiver.request('ui', 'render');
        } else {
          _this.autoScroll = false;
        }
      });

      this.element.on('select item', function (element, i) {
        _this.selectedLog = _this.getLogFromElement(element);
        if (_this.selectedLog) {
          _this.channel.emit('select log', _this.selectedLog);
        }
      });

      this.channel.reply({
        addLog: this.addLog,
        getSelectedLog: this.getSelectedLog
      }, this);
    }

    _createClass(LogsList, [{
      key: 'addLog',
      value: function addLog(log) {
        var element = undefined;

        this.logs[log.id] = log;
        this.logsCount++;

        if (log.parent) {
          var index = this.element.getItemIndex(log.parent.element) + log.parent.getChildren().length;
          this.element.insertItem(index, log.render());
          element = this.element.getItem(index);
        } else {
          element = this.element.add(log.render());
        }
        element.logId = log.id;
        if (this.autoScroll) {
          this.scrollToBottom();
        }
        if (this.logsCount === 1) {
          this.channel.emit('select log', log);
        }
        return element;
      }
    }, {
      key: 'getSelectedLog',
      value: function getSelectedLog() {
        return this.selectedLog;
      }
    }, {
      key: 'scrollToBottom',
      value: function scrollToBottom() {
        this.element.move(this.logsCount);
      }
    }, {
      key: 'getLogFromElement',
      value: function getLogFromElement(element) {
        return this.logs[element.logId];
      }
    }, {
      key: 'focus',
      value: function focus() {
        this.element.focus();
      }
    }]);

    return LogsList;
  })();

  var logDetails = (function () {
    function logDetails() {
      _classCallCheck(this, logDetails);

      this.channel = transceiver.channel('log');
      this.element = blessed.box({
        height: 6,
        left: '0',
        bottom: 0,
        tags: true,
        keys: true,
        padding: {
          left: 1,
          right: 1
        },
        style: {
          selected: {
            fg: 'black',
            bg: 'white',
            border: {
              fg: 'white'
            },
            hover: {
              bg: 'green'
            }
          }
        }
      });

      this.channel.on('select log', this.updateLogDetails.bind(this));
    }

    // https://github.com/yaronn/blessed-contrib/blob/master/lib/widget/tree.js

    _createClass(logDetails, [{
      key: 'updateLogDetails',
      value: function updateLogDetails(log) {
        this.element.setContent(this.renderType(log) + this.renderId(log) + this.renderDate(log) + this.renderDuration(log) + this.renderData(log));
      }
    }, {
      key: 'renderType',
      value: function renderType(log) {
        if (log.type === 'root') {
          return '{magenta-fg}{bold}ROOT NODE{/bold}{/magenta-fg}\n';
        }
        if (log.type === 'success') {
          return '{green-fg}✔ {bold}SUCCESS{/bold}{/green-fg}\n';
        }
        if (log.type === 'error') {
          return '{red-fg}✘ {bold}ERROR{/bold}{/red-fg}\n';
        }
        if (log.type === 'warn') {
          return '{yellow-fg}! {bold}WARN{/bold}{/red-fg}\n';
        }
        if (log.type === 'node') {
          return '{grey-fg}{bold}NODE{/bold}{/grey-fg}\n';
        }
        if (log.type === 'async') {
          if (log.status === 'resolved') {
            return '{bold}{green-fg}ASYNC NODE{/bold} (RESOLVED ✔){/green-fg}\n';
          }
          if (log.status === 'rejected') {
            return '{bold}{red-fg}ASYNC NODE{/bold} (REJECTED ✘){/red-fg}\n';
          }
          if (log.status === 'pending') {
            return '{cyan-fg}{bold}ASYNC NODE{/bold} (PENDING ⌛){/cyan-fg}\n';
          }
        }
        if (log.type === 'info') {
          return '{white-fg}{bold}INFO{/bold}{/white-fg}\n';
        }
        return '';
      }
    }, {
      key: 'renderId',
      value: function renderId(log) {
        return '{bold}ID:{/bold} {underline}' + log.id + '{/underline}\n';
      }
    }, {
      key: 'renderDate',
      value: function renderDate(log) {
        return '{bold}TIME:{/bold} {magenta-fg}' + dateFormat(log.date, 'dddd, mmmm dS yyyy, HH:MM:ss.L') + '{/magenta-fg}\n';
      }
    }, {
      key: 'renderDuration',
      value: function renderDuration(log) {
        if (log.relativeDuration && log.previousLog) {
          return '{bold}DURATION:{/bold} {yellow-fg}' + log.relativeDuration + '{/yellow-fg} (from {underline}' + log.previousLog.id + '{/underline})\n';
        }
        return '';
      }
    }, {
      key: 'renderData',
      value: function renderData(log) {
        if (log.data) {
          return '{bold}DATA:{/bold} ' + log.renderData() + '\n';
        }
        return '';
      }
    }]);

    return logDetails;
  })();

  var Node = blessed.Node;
  var Box = blessed.Box;

  function Tree(options) {

    if (!(this instanceof Node)) {
      return new Tree(options);
    }

    options = options || {};
    options.bold = true;
    var self = this;
    this.options = options;
    this.data = {};
    this.nodeLines = [];
    this.lineNbr = 0;
    Box.call(this, options);

    options.extended = options.extended || false;
    options.keys = options.keys || ['space', 'enter'];

    options.template = options.template || {};
    options.template.extend = options.template.extend || ' [+]';
    options.template.retract = options.template.retract || ' [-]';
    options.template.lines = options.template.lines || false;

    this.rows = blessed.list({
      height: 0,
      top: 1,
      width: 0,
      left: 1,
      selectedFg: 'black',
      selectedBg: 'white',
      keys: true,
      tags: true
    });

    this.rows.key(options.keys, function () {
      self.nodeLines[this.getItemIndex(this.selected)].extended = !self.nodeLines[this.getItemIndex(this.selected)].extended;
      self.setData(self.data);
      self.screen.render();

      self.emit('select', self.nodeLines[this.getItemIndex(this.selected)]);
    });

    this.append(this.rows);
  }

  Tree.prototype.walk = function (node, treeDepth) {
    var lines = [];

    if (!node.parent) {
      node.parent = null;
    }

    if (treeDepth == '' && node.name) {
      this.lineNbr = 0;
      this.nodeLines[this.lineNbr++] = node;
      lines.push(node.name);
      treeDepth = ' ';
    }

    node.depth = treeDepth.length - 1;

    if (node.children && node.extended) {

      var i = 0;

      if (typeof node.children == 'function') {
        node.childrenContent = node.children(node);
      }

      if (!node.childrenContent) {
        node.childrenContent = node.children;
      }

      for (var child in node.childrenContent) {

        if (!node.childrenContent[child].name) {
          node.childrenContent[child].name = child;
        }

        var childIndex = child;
        child = node.childrenContent[child];
        child.parent = node;
        child.position = i++;

        if (typeof child.extended == 'undefined') {
          child.extended = this.options.extended;
        }

        if (typeof child.children == 'function') {
          child.childrenContent = child.children(child);
        } else {
          child.childrenContent = child.children;
        }

        var isLastChild = child.position == Object.keys(child.parent.childrenContent).length - 1;
        var tree;
        var suffix = '';
        if (isLastChild) {
          tree = '└';
        } else {
          tree = '├';
        }
        if (!child.childrenContent || Object.keys(child.childrenContent).length == 0) {
          tree += '─';
        } else if (child.extended) {
          tree += '┬';
          suffix = this.options.template.retract;
        } else {
          tree += '─';
          suffix = this.options.template.extend;
        }

        if (!this.options.template.lines) {
          tree = '|-';
        }

        lines.push(treeDepth + tree + child.name + suffix);

        this.nodeLines[this.lineNbr++] = child;

        var parentTree;
        if (isLastChild || !this.options.template.lines) {
          parentTree = treeDepth + ' ';
        } else {
          parentTree = treeDepth + '│';
        }
        lines = lines.concat(this.walk(child, parentTree));
      }
    }
    return lines;
  };

  Tree.prototype.focus = function () {
    this.rows.focus();
  };

  Tree.prototype.render = function () {
    if (this.screen.focused == this.rows) {
      this.rows.focus();
    }

    this.rows.width = this.width - 3;
    this.rows.height = this.height - 3;
    Box.prototype.render.call(this);
  };

  Tree.prototype.setData = function (data) {

    var formatted = [];
    formatted = this.walk(data, '');

    this.data = data;
    this.rows.setItems(formatted);
  };

  Tree.prototype.__proto__ = Box.prototype;

  Tree.prototype.type = 'tree';

  var ui_tree = Tree;

  var Inspector = (function () {
    function Inspector() {
      _classCallCheck(this, Inspector);

      this.channel = transceiver.channel('log');

      this.element = ui_tree({
        top: 'center',
        left: 'center',
        width: '90%',
        height: '75%',
        hidden: true,
        label: 'Inspector',
        tags: true,
        border: {
          type: 'line'
        },
        style: {
          fg: 'white',
          border: {
            fg: '#f0f0f0'
          }
        },
        template: {
          extend: '{bold}{green-fg} [+]{/}',
          retract: '{bold}{yellow-fg} [-]{/}',
          lines: true
        }
      });
    }

    _createClass(Inspector, [{
      key: 'open',
      value: function open(selectedLog) {
        if (!selectedLog || !selectedLog.data && !selectedLog.stackTrace) {
          return;
        }
        this.opened = true;
        this.element.show();
        this.element.focus();
        this.element.setData(this.prepareData(selectedLog));
      }
    }, {
      key: 'close',
      value: function close() {
        this.opened = false;
        this.element.hide();
      }
    }, {
      key: 'prepareData',
      value: function prepareData(log) {
        var content = {};
        if (log.data) {
          content.data = JSON.parse(_prune(log.data, {
            depthDecr: 7,
            replacer: function replacer(value, defaultValue, circular) {
              if (typeof value === 'function') {
                return '"Function [pruned]"';
              }
              if (Array.isArray(value)) {
                return '"Array (' + value.length + ') [pruned]"';
              }
              if (typeof value === 'object') {
                return '"Object [pruned]"';
              }
              return defaultValue;
            }
          }));
        }

        if (log.stackTrace) {
          content['stack trace'] = log.stackTrace.map(function (callsite) {
            var relativePath = path.relative(appRoot.toString(), callsite.file);
            return {
              type: callsite.type,
              'function': callsite['function'],
              method: callsite.method,
              file: relativePath + ':{yellow-fg}' + callsite.line + '{/yellow-fg}:{yellow-fg}' + callsite.column + '{/yellow-fg}'
            };
          });
        }
        return this.formatData(content);
      }
    }, {
      key: 'formatData',
      value: function formatData(data, key) {
        var _this2 = this;

        var depth = arguments.length <= 2 || arguments[2] === undefined ? 0 : arguments[2];

        depth++;
        if (typeof data === 'object') {
          if (data !== null) {
            var _ret = (function () {
              var name = undefined;
              var extended = undefined;

              if (depth === 2) {
                name = '{yellow-fg}{bold}' + key.toUpperCase() + '{/bold}{/yellow-fg} {magenta-fg}(' + data.length + '){/magenta-fg}';
                extended = key === 'data';
              } else {
                var type = Array.isArray(data) ? '[Array] {magenta-fg}(' + data.length + '){/magenta-fg}' : '[Object]';
                name = '{blue-fg}{bold}' + (key ? key + ' ' : '') + '{/bold}' + type + '{/blue-fg}';
                extended = depth < 4;
              }
              var newObj = {
                children: {},
                name: name,
                extended: extended
              };
              Object.keys(data).forEach(function (key) {
                var child = _this2.formatData(data[key], key, depth);
                if (child) {
                  newObj.children[key] = child;
                }
              });
              return {
                v: newObj
              };
            })();

            if (typeof _ret === 'object') return _ret.v;
          }
        }
        if (typeof data === 'function') {
          return {
            name: '{blue-fg}' + key + '{/blue-fg}: {red-fg}{bold}[Function]{/}'
          };
        }
        if (typeof data === 'number') {
          return {
            name: '{blue-fg}' + key + '{/blue-fg}: {yellow-fg}' + data + '{/}'
          };
        }
        if (data === null) {
          return {
            name: '{blue-fg}' + key + '{/blue-fg}: {cyan-fg}{bold}null{/}'
          };
        }
        return {
          name: '{blue-fg}' + key + '{/blue-fg}: ' + data
        };
      }
    }]);

    return Inspector;
  })();

  var Ui = (function () {
    function Ui() {
      var _this3 = this;

      _classCallCheck(this, Ui);

      this.channel = transceiver.channel('ui');
      this.screen = blessed.screen({
        smartCSR: true
      });

      this.logsList = new LogsList();
      this.logDetails = new logDetails();
      this.inspector = new Inspector();

      this.separator = blessed.line({
        bottom: 6,
        orientation: 'horizontal'
      });

      this.screen.append(this.logsList.element);
      this.screen.append(this.logDetails.element);
      this.screen.append(this.separator);
      this.screen.append(this.inspector.element);

      this.logsList.element.focus();

      this.screen.key(['q', 'C-c'], function (ch, key) {
        return process.exit(0);
      });

      this.screen.key(['i'], this.toggleInspector.bind(this));

      this.screen.render();

      this.channel.reply('render', function () {
        return _this3.screen.render();
      });
    }

    _createClass(Ui, [{
      key: 'toggleInspector',
      value: function toggleInspector() {
        if (this.inspector.opened) {
          this.inspector.close();
          this.logsList.focus();
        } else {
          this.inspector.open(this.logsList.selectedLog);
        }
        this.screen.render();
      }
    }]);

    return Ui;
  })();

  var LogItem = (function () {
    function LogItem(_ref) {
      var name = _ref.name;
      var type = _ref.type;
      var status = _ref.status;
      var parent = _ref.parent;
      var data = _ref.data;
      var message = _ref.message;
      var stackTrace = _ref.stackTrace;
      var _ref$date = _ref.date;
      var date = _ref$date === undefined ? Date.now() : _ref$date;

      _classCallCheck(this, LogItem);

      this.id = shortid.generate();
      this.name = name;
      this.type = type;
      this.status = status;
      this.data = data;
      this.message = message;
      this.stackTrace = stackTrace;
      this.date = date;
      this.children = [];
      this.channel = transceiver.channel('log');

      if (parent) {
        this.depth = parent.depth + 1;
        this.parent = parent;
        this.previousLog = parent.getLastChild() || parent;
        this.relativeDuration = this.getRelativeDuration();
        this.parent.addChild(this);
      } else {
        this.depth = 0;
      }
      this.element = this.channel.request('addLog', this);
      this.update();
    }

    _createClass(LogItem, [{
      key: 'update',
      value: function update() {
        if (this.element) {
          this.element.content = this.render();
          transceiver.request('ui', 'render');
        }
      }
    }, {
      key: 'render',
      value: function render() {
        var message = '' + this.renderState() + this.renderName() + this.renderMessage() + this.renderData() + this.renderDate() + this.renderDuration();
        for (var i = 0; i < this.depth; i++) {
          message = '    ' + message;
        }
        return message;
      }
    }, {
      key: 'renderState',
      value: function renderState() {
        if (this.type === 'async' && this.status === 'pending') {
          return '{cyan-fg}[⌛]{/cyan-fg} ';
        }
        if (this.type === 'async' && this.status === 'resolved') {
          return '{green-fg}[✔]{/green-fg} ';
        }
        if (this.type === 'async' && this.status === 'rejected') {
          return '{red-fg}[✘]{/red-fg} ';
        }
        if (this.type === 'success') {
          return '{green-fg}✔{/green-fg} ';
        }
        if (this.type === 'error') {
          return '{red-fg}✘{/red-fg} ';
        }
        if (this.type === 'warn') {
          return '{yellow-fg}❗{/yellow-fg} ';
        }
        if (this.type === 'info') {
          return '⇢ ';
        }
        return '';
      }
    }, {
      key: 'renderName',
      value: function renderName() {
        if (this.depth === 0) {
          return this.name ? '{underline}{bold}' + this.name + '{/bold}{/underline} ' : '';
        }
        if (this.type === 'async') {
          if (this.status === 'resolved') {
            return '{bold}{green-fg}' + this.name + '{/green-fg}{/bold} (async) ';
          }
          if (this.status === 'rejected') {
            return '{bold}{red-fg}' + this.name + '{/red-fg}{/bold} (async) ';
          }
          return '{bold}' + this.name + '{/bold} (async) ';
        }
        if (this.type === 'success') {
          return this.name ? '{bold}{green-fg}' + this.name + '{/green-fg}{/bold} ' : '';
        }
        if (this.type === 'error') {
          return this.name ? '{bold}{red-fg}' + this.name + '{/red-fg}{/bold} ' : '';
        }
        if (this.type === 'warn') {
          return this.name ? '{bold}{yellow-fg}' + this.name + '{/yellow-fg}{/bold} ' : '';
        }
        return this.name ? '{bold}' + this.name + '{/bold} ' : '';
      }
    }, {
      key: 'renderData',
      value: function renderData() {
        if (this.depth === 0) {
          // console.log(this.data);
        }
        if (!this.data) {
          return '';
        }
        if (Array.isArray(this.data)) {
          return this.data.map(this.renderValue.bind(this)).join(' ') + ' ';
        }
        return this.renderValue(this.data) + ' ';
      }
    }, {
      key: 'renderValue',
      value: function renderValue(value) {
        if (Array.isArray(value)) {
          return '{cyan-fg}' + this.prune(value) + '{/cyan-fg}';
        }
        if (typeof value === 'object') {
          return '{blue-fg}' + this.prune(value) + '{/blue-fg}';
        }
        if (typeof value === 'function') {
          return '{red-fg}{bold}[Function]{/bold}{red-fg}';
        }
        if (typeof value === 'number') {
          return '{yellow-fg}' + value + '{/yellow-fg}';
        }
        if (typeof value === 'string') {
          if (this.type === 'success') {
            return '{green-fg}' + value + '{/green-fg}';
          }
          if (this.type === 'error') {
            return '{red-fg}' + value + '{/red-fg}';
          }
          if (this.type === 'warn') {
            return '{yellow-fg}' + value + '{/yellow-fg}';
          }
        }
        return value;
      }
    }, {
      key: 'renderMessage',
      value: function renderMessage() {
        if (this.message) {
          if (this.type === 'success') {
            return '{green-fg}' + this.message + '{/green-fg} ';
          }
          if (this.type === 'error') {
            return '{red-fg}' + this.message + '{/red-fg} ';
          }
          if (this.type === 'warn') {
            return '{yellow-fg}' + this.message + '{/yellow-fg} ';
          }
          return this.message + ' ';
        }
        return '';
      }
    }, {
      key: 'renderDate',
      value: function renderDate() {
        if (this.depth === 0) {
          return '{magenta-fg}(' + dateFormat(this.date, 'dd/mm/yyyy HH:MM:ss.L') + '){/magenta-fg} ';
        }
        return '';
      }
    }, {
      key: 'renderDuration',
      value: function renderDuration() {
        if (this.relativeDuration) {
          return '{grey-fg}+' + this.relativeDuration + '{/grey-fg} ';
        }
        return '';
      }
    }, {
      key: 'getRelativeDuration',
      value: function getRelativeDuration() {
        return this.humanizeDuration(this.date - this.previousLog.date);
      }
    }, {
      key: 'humanizeDuration',
      value: function humanizeDuration(duration) {
        if (duration < 1000) {
          return duration + 'ms';
        }
        if (duration < 60000) {
          var milliseconds = duration % 1000;
          milliseconds = ('000' + milliseconds).slice(-3);
          return Math.floor(duration / 1000) + '.' + milliseconds + 's';
        }
        return Math.floor(duration / 60000) + 'm ' + Math.round(duration % 60000 / 1000) + 's';
      }
    }, {
      key: 'addChild',
      value: function addChild(log) {
        this.children.push(log);
      }
    }, {
      key: 'getLastChild',
      value: function getLastChild() {
        return this.children[this.children.length - 1];
      }
    }, {
      key: 'getChildren',
      value: function getChildren(list) {
        list = list || [];
        list.push.apply(list, this.children);
        this.children.forEach(function (child) {
          child.getChildren(list);
        });
        return list;
      }
    }, {
      key: 'setStatus',
      value: function setStatus(status) {
        this.status = status;
        this.update();
      }
    }, {
      key: 'prune',
      value: function prune(value) {
        return _prune(value, {
          depthDecr: 2,
          arrayMaxLength: 8,
          prunedString: ' [...]'
        });
      }
    }]);

    return LogItem;
  })();

  var Agent = (function () {
    function Agent(_ref2) {
      var name = _ref2.name;
      var type = _ref2.type;
      var status = _ref2.status;
      var data = _ref2.data;
      var message = _ref2.message;
      var _ref2$isAsync = _ref2.isAsync;
      var isAsync = _ref2$isAsync === undefined ? false : _ref2$isAsync;
      var ancestors = _ref2.ancestors;

      _classCallCheck(this, Agent);

      this.name = name;
      this.children = {};
      this.isAsync = isAsync;
      this.asyncState = this.isAsync ? 'pending' : null;
      this.type = type;
      this.status = status;

      if (!ancestors) {
        this.ancestors = [];
        this.isRoot = true;
      } else {
        this.ancestors = ancestors;
        this.parent = this.ancestors[this.ancestors.length - 1];
      }

      this.logItem = new LogItem({
        name: this.name,
        type: this.type,
        status: this.status,
        parent: this.parent ? this.parent.logItem : null,
        data: data,
        message: message,
        stackTrace: this.generateStackTrace(stack_trace.get())
      });

      return this;
    }

    _createClass(Agent, [{
      key: 'log',
      value: function log() {
        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        new Agent({
          type: 'info',
          data: args,
          ancestors: this.ancestors.concat(this)
        });
        return this;
      }
    }, {
      key: 'warn',
      value: function warn() {
        for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          args[_key2] = arguments[_key2];
        }

        new Agent({
          type: 'warn',
          data: args,
          ancestors: this.ancestors.concat(this)
        });
        return this;
      }
    }, {
      key: 'success',
      value: function success() {
        for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
          args[_key3] = arguments[_key3];
        }

        new Agent({
          type: 'success',
          data: args,
          ancestors: this.ancestors.concat(this)
        });
        return this;
      }
    }, {
      key: 'error',
      value: function error() {
        for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
          args[_key4] = arguments[_key4];
        }

        new Agent({
          type: 'error',
          data: args,
          ancestors: this.ancestors.concat(this)
        });
        return this;
      }
    }, {
      key: 'child',
      value: function child(name) {
        if (!this.children[name]) {
          this.children[name] = new Agent({
            name: name,
            type: 'node',
            ancestors: this.ancestors.concat(this)
          });
        }

        for (var _len5 = arguments.length, args = Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
          args[_key5 - 1] = arguments[_key5];
        }

        if (args.length) {
          var _children$name;

          (_children$name = this.children[name]).log.apply(_children$name, args);
        }
        return this.children[name];
      }
    }, {
      key: 'async',
      value: function async(name) {
        if (!this.children[name]) {
          this.children[name] = new Agent({
            name: name,
            type: 'async',
            status: 'pending',
            isAsync: true,
            ancestors: this.ancestors.concat(this)
          });
        }
        if (!this.children[name].isAsync) {
          this.internalWarn('Child agent {bold}' + name + '{/bold} is defined as a non async agent');
        }

        for (var _len6 = arguments.length, args = Array(_len6 > 1 ? _len6 - 1 : 0), _key6 = 1; _key6 < _len6; _key6++) {
          args[_key6 - 1] = arguments[_key6];
        }

        if (args.length) {
          var _children$name2;

          (_children$name2 = this.children[name]).log.apply(_children$name2, args);
        }
        return this.children[name];
      }
    }, {
      key: 'resolve',
      value: function resolve() {
        if (this.isAsync) {
          if (this.logItem.status === 'pending') {
            this.logItem.setStatus('resolved');
            var resolveLog = new Agent({
              name: this.name,
              type: 'success',
              message: 'resolved',
              ancestors: this.ancestors.concat(this)
            });

            for (var _len7 = arguments.length, args = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
              args[_key7] = arguments[_key7];
            }

            if (args.length) {
              resolveLog.success.apply(resolveLog, args);
            }
          } else {
            this.internalWarn('Trying to resolve an already {bold}' + this.logItem.status + '{/bold} async agent');
          }
        } else {
          this.internalWarn('Trying to resolve a non async agent');
        }
        return this;
      }
    }, {
      key: 'reject',
      value: function reject() {
        if (this.isAsync) {
          if (this.logItem.status === 'pending') {
            this.logItem.setStatus('rejected');
            var rejectLog = new Agent({
              name: this.name,
              type: 'error',
              message: 'rejected',
              ancestors: this.ancestors.concat(this)
            });

            for (var _len8 = arguments.length, args = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
              args[_key8] = arguments[_key8];
            }

            if (args.length) {
              rejectLog.error.apply(rejectLog, args);
            }
          } else {
            this.internalWarn('Trying to reject an already {bold}' + this.logItem.status + '{/bold} async agent');
          }
        } else {
          this.internalWarn('Trying to reject a non async agent');
        }
        return this;
      }
    }, {
      key: 'internalWarn',
      value: function internalWarn(message) {
        new Agent({
          name: this.name,
          type: 'warn',
          message: message,
          ancestors: this.ancestors.concat(this)
        });
      }
    }, {
      key: 'getAncestorsNames',
      value: function getAncestorsNames() {
        return this.ancestors.map(function (ancestor) {
          return ancestor.name;
        });
      }
    }, {
      key: 'generateStackTrace',
      value: function generateStackTrace(trace) {
        var stackTrace = [];
        for (var i = 0; i < 5; i++) {
          stackTrace.push({
            type: trace[i].getTypeName(),
            'function': trace[i].getFunctionName(),
            method: trace[i].getMethodName(),
            file: trace[i].getFileName(),
            line: trace[i].getLineNumber(),
            column: trace[i].getColumnNumber()
          });
        }
        return stackTrace;
      }
    }]);

    return Agent;
  })();

  var agent = function agent(name) {
    for (var _len9 = arguments.length, args = Array(_len9 > 1 ? _len9 - 1 : 0), _key9 = 1; _key9 < _len9; _key9++) {
      args[_key9 - 1] = arguments[_key9];
    }

    return new Agent({
      name: name,
      type: 'root',
      data: args.length ? args : undefined
    });
  };

  transceiver.setPromise(null);

  var ui = new Ui();

  var investigator = { ui: ui, agent: agent };

  return investigator;
});
//# sourceMappingURL=investigator.js.map
