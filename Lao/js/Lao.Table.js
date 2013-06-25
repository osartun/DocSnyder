(function (win, doc, Backbone, _, $, Lao) {

	var Table = Lao.extend("Component", {
		template: "<div class='LaoTableRoot'></div>",
		className: "LaoTable",
		tableTemplate: "<div class='LaoTable'></div>",
		rowTemplate: "<div class='LaoTableRow'></div>",
		cellTemplate: "<div class='LaoTableCell'></div>",
		rows: 0,
		columns: 0,
		rowRegistry: [],
		initialize: function (attr) {
			if (attr.columns === +attr.columns) {
				this.columns = attr.columns|0; // make it an integer
			}
			if (attr.rows === +attr.rows) {
				this.rows = attr.rows|0; // make it an integer
			}
			this.cellRegistry = [];
			this.generateTable();
		},
		_registerElement: function (type, element, at) {
			if (element && !element.nodeName && element[0] && element[0].nodeName) {
				element = element[0];
			}
			var arr = this[type + "Registry"];

			if (!element || !arr) return;

			if (at === +at) {
				arr.splice(at, 0, element);
			} else {
				arr.push(element);
			}
		},
		_mapTable: function () {
			// Creates a two-dimensional array in which the table-cells are referenced
			// For access which is faster than DOM-Traversal
			if (this.rows > 0 && this.columns > 0) {
				var i = 0, j, k = 0,
					rows = this.rows,
					cols = this.columns,
					map = this.tableMap = new Array(rows),
					cells = this.cellRegistry,
					rowArr;
				for (; i < rows; i++) {
					rowArr = map[i] = new Array(cols);
					for (j = 0; j < cols; j++) {
						rowArr[j] = cells[k];
						k++;
					}
				}
			}
		},
		generateTable: function () {
			if (this.rows > 0 && this.columns > 0) {
				this.empty();
				var i,j, rows = this.rows, cols = this.columns, table = this, row, cell;
				for (i = 0; i < rows; i++) {
					row = $(this.rowTemplate).appendTo(table);
					this._registerElement("row", row);
					for (j = 0; j < cols; j++) {
						cell = $(this.cellTemplate).appendTo(row);
						this._registerElement("cell", cell);
					}
				}
				this._mapTable();
			}
		},
		getCell: function (row, col) {
			if (col >= 0 && row >= 0 && this.tableMap[row]) {
				return this.pushStack([this.tableMap[row][col]]);
			}
		},
		addColumns: function (count, at) {
			// Adds one or more columns to each row
			if (count !== +count) {
				count = 1;
			}
			if (at > this.columns || at < 0) {
				at = this.columns;
			}
			this.columns++;

			var i = 0, rows = this.rowRegistry, l = rows.length, row,
				j, cells, cell;
			for (; i < l; i++) {
				row = rows[i];
				cells = row.children();
				for (j = 0; j < count; j++) {
					cell = $(this.cellTemplate);
					if (cells.length) {
						cells.eq(at).after(cell);
					} else {
						row.append(cell);
					}
					this._registerElement("cell", cell, cells.length ? i * this.columns + at : (i+1) * this.columns);
				}
			}
			this._mapTable();
		},
		addColumn: function (at) {
			// Adds one column to each row
			return this.addColumns(1, at);
		},
		addRows: function (count, at) {
			// Adds one or more rows to the table
			if (count !== +count) {
				count = 1;
			}
			if (at > this.rows || at < 0) {
				at = this.rows;
			}
			this.rows++;

			var i = 0, rows = this.children(), row,
				j, colCount = this.columns, cell;
			for (; i < count; i++) {
				row = $(this.rowTemplate);
				if (rows.length) {
					rows.eq(at).after(row);
				} else {
					this.append(row);
				}
				for (j = 0; j < colCount; j++) {
					cell = $(this.cellTemplate).appendTo(row);
					this._registerElement("cell", cell, !rows.length ? 0 : at * colCount + j);
				}
				this._registerElement("row", row, at);
			}
			this._mapTable();
		},
		addRow: function (at) {
			// Adds one row to the table
			return this.addRows(1, at);
		}
	}),
	Scaffold = Lao.extend("Component", {
		template: "<div></div>",
		className: "LaoScaffold",
		boothRegistry: {},
		initialize: function (attr) {
			this.generateScaffold(attr, !!attr.vertical, this);
		},
		_createTable: function (col, row) {
			return new Table({
				columns: col,
				rows: row
			})
		},
		generateScaffold: function (structure, vertical, el) {
			if (structure.children && vertical === !!vertical) {
				el.empty();
				var boothCount = _.size(structure.children),
					cols = vertical ? boothCount : 1,
					rows = vertical ? 1 : boothCount,
					table = this._createTable(cols, rows),
					booth, i = 0;
				el.append(table);
				_.each(structure.children, function (boothData, name) {
					booth = vertical ? table.getCell(0, i) : table.getCell(i, 0);
					if (boothData.className) {
						booth.addClass(boothData.className);
					}
					booth.attr("name", name).css(boothData);
					this._registerBooth(booth[0], name);

					if (boothData.children) {
						this.generateScaffold(boothData, !vertical, booth);
					}
					i++;
				}, this);
			}
		},
		_registerBooth: function (booth, name) {
			this.boothRegistry[name] = booth;
		},
		getBooth: function (name) {
			if (name) {
				return this.pushStack([this.boothRegistry[name]]);
			}
		}
	})

	Lao.define({
		"Table": Table,
		"Scaffold": Scaffold
	});

})(window, document, Backbone, _, jQuery, Lao)