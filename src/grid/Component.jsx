/**
 * Copyright (с) 2015, SoftIndex LLC.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule UIKernel
 */

'use strict';

/**
 * React table component
 */

var React = require('react');
var utils = require('../common/utils');
var gridMixinColumns = require('./mixins/columns');
var gridMixinPagination = require('./mixins/pagination');
var gridMixinStatuses = require('./mixins/statuses');
var gridMixinSorting = require('./mixins/sorting');
var gridMixinData = require('./mixins/data');
var gridMixinEditor = require('./mixins/editor');
var gridMixinUI = require('./mixins/ui');
var gridMixinSelect = require('./mixins/select');

var RESET_MODEL = 1 << 0;
var RESET_VIEW_COLUMNS = 1 << 1;
var RESET_SORT = 1 << 2;
var RESET_VIEW_COUNT = 1 << 3;

var GridComponent = React.createClass({
  propTypes: {
    className: React.PropTypes.string
  },
  mixins: [
    gridMixinColumns,       // Columns control function
    gridMixinPagination,    // Pagination control function
    gridMixinStatuses,      // Record statuses control function
    gridMixinSorting,       // Sort control function
    gridMixinData,          // Data control function
    gridMixinEditor,        // Cell editors control function
    gridMixinUI,            // User interfaces control function
    gridMixinSelect         // Rows selection control function (Select)
  ],
  componentDidMount: function () {
    if (this.props.model) {
      this.props.model.on('update', this._setData);
    }
    this.updateTable();
  },
  componentWillUnmount: function () {
    if (this.props.model) {
      this.props.model.off('update', this._setData);
    }
  },
  componentWillReceiveProps: function (nextProps) {
    var oldProps = this.props;
    var reset = 0;

    if (!utils.isEqual(this.props.model, nextProps.model)) {
      reset |= RESET_MODEL;
    }
    if (!utils.isEqual(this.props.viewColumns, nextProps.viewColumns)) {
      reset |= RESET_VIEW_COLUMNS;
    }
    if (!utils.isEqual(this.props.sort, nextProps.sort)) {
      reset |= RESET_SORT;
    }
    if (this.props.viewCount !== nextProps.viewCount) {
      reset |= RESET_VIEW_COUNT;
    }

    if (!reset) {
      return;
    }

    this.setState({}, function () {
      if (reset & RESET_SORT || reset & RESET_MODEL || reset & RESET_VIEW_COUNT) {
        if (reset & RESET_MODEL) {
          this.state.data = null;
          if (oldProps.model) {
            oldProps.model.off('update', this._setData);
          }
          if (this.props.model) {
            this.props.model.on('update', this._setData);
          }
          this._reset();
        }
        this.updateTable();
      } else if (reset & RESET_VIEW_COLUMNS) {
        this._renderBody();
      }
    });
  },
  render: function () {
    var component = this;
    var header = this._formHeader();
    var gridClassNames = ['data-grid'];

    if (this.props.className) {
      gridClassNames.push(this.props.className);
    }

    return (
      <div className={gridClassNames.join(' ')}>
        <table cellSpacing="0" className="dgrid-header">
          <colgroup>{header.colGroup}</colgroup>
            {header.cols.map(function (row, colKey) {
              return (
                <tr key={colKey}>
                  {row.map(function (col, rowKey) {
                    return (
                      <th
                        key={rowKey}
                        className={col.className}
                        onClick={
                          col.sort ?
                            component._sortCol.bind(component, col.field) :
                            null
                          }
                        colSpan={col.cols}
                        rowSpan={col.rows}
                        dangerouslySetInnerHTML={{
                          __html: col.name || ''
                        }}
                      />
                    );
                  })}
                </tr>
              );
            })}
        </table>
        <div
          style={{maxHeight: this.props.height}}
          className={[
            'dgrid-body-wrapper',
            this.props.height ? 'dgrid-scrollable' : null
          ].join(' ')}
        >
          <div className="dgrid-body">
            <div className="dgrid-loader" ref="loader"></div>
            <table
              cellSpacing="0"
              className="dgrid-body-table"
              ref="body"
              onClick={this.handleBodyClick}
            >
              <colgroup>{header.colGroup}</colgroup>
              <tbody ref="tbody"/>
            </table>
          </div>
        </div>
        {this._renderTotals()}
        {this._renderPagination()}
      </div>
    );
  }
});

module.exports = GridComponent;
