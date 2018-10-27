var DatatablesDataSourceAjaxServer = function() {

	// Data table init function
	var initTable = function() {
		var table = $('#data-table');

		// Init data table
		var oTable = table.DataTable({

			responsive: true,
			searchDelay: 500,

			// Data source
			ajax: {
				url: '/home/personnel/service-agent/read',
			},

			//== Pagination settings
			dom: `
			<'row'<'col-sm-6 text-left'f><'col-sm-6 text-right'B>>
			<'row'<'col-sm-12'tr>>
			<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7 dataTables_pager'lp>>`,
			order: [[1, 'desc']],

			headerCallback: function(thead, data, start, end, display) {
				thead.getElementsByTagName('th')[0].innerHTML = `
                    <label class="m-checkbox m-checkbox--single m-checkbox--solid m-checkbox--brand">
                        <input type="checkbox" value="" class="m-group-checkable">
                        <span></span>
                    </label>`;
			},

			// Data table button
			buttons: [
				{ 
					text: '<i class="fa fa-user-edit"></i> <span>編輯</span>',
					attr: {
						id: 'editButton',
						class: 'btn btn-outline-primary m-btn m-btn--custom m-btn--icon  m-btn--pill m-btn--bolder',
						style: "display:block; margin-right:0.5em;"
					},
				},

				{ 
					text: '<i class="fa fa-save"></i> <span>保存</span>', 
					attr: {
						id: 'saveButton',
						class: 'btn btn-outline-primary m-btn m-btn--custom m-btn--icon  m-btn--pill m-btn--bolder',
						style: "display:none; margin-right:0.5em;"
					},	
				},
				{ 
					text: '取消', 
					attr: {
						id: 'cancelButton',
						class: 'btn btn-outline-primary m-btn m-btn--custom m-btn--icon  m-btn--pill m-btn--bolder',
						style: "display:none; margin-right:0.5em;"
					},
				},
				{ 
					text: '<i class="fa fa-user-slash"></i> <span>刪除</span>', 
					attr: {
						id: 'deleteButton',
						class: 'btn btn-outline-danger m-btn m-btn--custom m-btn--icon  m-btn--pill m-btn--bolder',
						style: "display:block; margin-right:0.5em;"
					},
				},
			],
			
			// Column data
			columns: [
				{data: 'id'},
				{data: 'userAccount'},
				{data: 'name'},
				{data: 'lineId'},
				{data: 'wechatId'},
				{data: 'facebookId'},
				{data: 'phoneNumber'},
				{data: 'bankSymbol'},
				{data: 'bankName'},
				{data: 'bankAccount'},
				{data: 'comment'},
				{data: 'updatetime'},
				{data: 'createtime'}
			],
			
			columnDefs: [
				{
					targets: 0,
					width: '30px',
					className: 'dt-right',
					orderable: false,
					render: function(data, type, full, meta) {
						return `
                        <label class="m-checkbox m-checkbox--single m-checkbox--solid m-checkbox--brand">
                            <input type="checkbox" value="" class="m-checkable">
                            <span></span>
                        </label>`;
					},
				},
			],
		});

		// Check row handler
		table.on('change', '.m-group-checkable', function() {
			var set = $(this).closest('table').find('td:first-child .m-checkable');
			var checked = $(this).is(':checked');

			$(set).each(function() {
				if (checked) {
					$(this).prop('checked', true);
					$(this).closest('tr').addClass('active');
				}
				else {
					$(this).prop('checked', false);
					$(this).closest('tr').removeClass('active');
				}
			});
		});

		// Check row handler
		table.on('change', 'tbody tr .m-checkbox', function() {
			$(this).parents('tr').toggleClass('active');
		});

		//Function to restore rows from input field -> origin format
		function restoreRow(){

			// Iterate each row in table
			oTable.rows().every( function ( rowIdx, tableLoop, rowLoop ) {

				// Check whether this row has been check
				var rowNode = this.node();
				var isChecked = $(rowNode).hasClass('active');

				if (isChecked) {
					
					var name =oTable.cell(rowIdx, 2).data();
					var lineId = oTable.cell(rowIdx, 3).data();
					var wechatId = oTable.cell(rowIdx, 4).data();
					var facebookId = oTable.cell(rowIdx, 5).data();
					var phone = oTable.cell(rowIdx, 6).data();
					var bankSymbol = oTable.cell(rowIdx, 7).data();
					var bankName = oTable.cell(rowIdx, 8).data();
					var bankAccount = oTable.cell(rowIdx, 9).data();
					var comment = oTable.cell(rowIdx, 10).data();
					
					//console.log('index is restored : ' + rowIdx);
					oTable.cell(rowIdx,2).node().innerHTML = name;
					oTable.cell(rowIdx,3).node().innerHTML = lineId;
					oTable.cell(rowIdx,4).node().innerHTML = wechatId;
					oTable.cell(rowIdx,5).node().innerHTML = facebookId;
					oTable.cell(rowIdx,6).node().innerHTML = phone;
					oTable.cell(rowIdx,7).node().innerHTML = bankSymbol;
					oTable.cell(rowIdx,8).node().innerHTML = bankName;
					oTable.cell(rowIdx,9).node().innerHTML = bankAccount;
					oTable.cell(rowIdx,10).node().innerHTML = comment;
				}
			});
		};

		// Function to change selected rows from origin format -> input field
		function editRow(){

			// Iterate each row in table
			oTable.rows().every( function ( rowIdx, tableLoop, rowLoop ) {

				// Check whether this row has been check
				var rowNode = this.node();
				var isChecked = $(rowNode).hasClass('active');

				if (isChecked) {
					
					var name =oTable.cell(rowIdx, 2).data();
					var lineId = oTable.cell(rowIdx, 3).data();
					var wechatId = oTable.cell(rowIdx, 4).data();
					var facebookId = oTable.cell(rowIdx, 5).data();
					var phone = oTable.cell(rowIdx, 6).data();
					var bankSymbol = oTable.cell(rowIdx, 7).data();
					var bankName = oTable.cell(rowIdx, 8).data();
					var bankAccount = oTable.cell(rowIdx, 9).data();
					var comment = oTable.cell(rowIdx, 10).data();
					
					//console.log('index is cheched : ' + rowIdx);
					oTable.cell(rowIdx,2).node().innerHTML = `<input type="text" class="form-control input-small" value=${name}>`;
					oTable.cell(rowIdx,3).node().innerHTML = `<input type="text" class="form-control input-small" value=${lineId}>`;
					oTable.cell(rowIdx,4).node().innerHTML = `<input type="text" class="form-control input-small" value=${wechatId}>`;
					oTable.cell(rowIdx,5).node().innerHTML = `<input type="text" class="form-control input-small" value=${facebookId}>`;
					oTable.cell(rowIdx,6).node().innerHTML = `<input type="text" class="form-control input-small" value=${phone}>`;
					oTable.cell(rowIdx,7).node().innerHTML = `<input type="text" class="form-control input-small" value=${bankSymbol}>`;
					oTable.cell(rowIdx,8).node().innerHTML = `<input type="text" class="form-control input-small" value=${bankName}>`;
					oTable.cell(rowIdx,9).node().innerHTML = `<input type="text" class="form-control input-small" value=${bankAccount}>`;
					oTable.cell(rowIdx,10).node().innerHTML = `<input type="text" class="form-control input-small" value=${comment}>`;
				}
			});
		};

		$('#editButton').click(function(e){
			e.preventDefault();
			
			oTable.column(0).visible(false);
			$('#saveButton').css('display', 'block');
			$('#cancelButton').css('display', 'block');
			$('#editButton').css('display', 'none');
			$('#deleteButton').css('display', 'none');

			editRow();
			
		});

		$('#saveButton').click(function(e){
			e.preventDefault();
			
			var data = [];

			// Iterate each row in table
			oTable.rows().every( function ( rowIdx, tableLoop, rowLoop ) {

				// Check whether this row has been check
				var rowNode = this.node();
				var isChecked = $(rowNode).hasClass('active');

				if (isChecked) {
					var obj = {};
					obj["id"] = oTable.cell(rowIdx, 0).data();
					obj["name"] = oTable.cell(rowIdx, 2).node().childNodes[0].value;
					obj["lineId"] = oTable.cell(rowIdx, 3).node().childNodes[0].value;
					obj["wechatId"] = oTable.cell(rowIdx, 4).node().childNodes[0].value;
					obj["facebookId"] = oTable.cell(rowIdx, 5).node().childNodes[0].value;
					obj["phone"] = oTable.cell(rowIdx, 6).node().childNodes[0].value;
					obj["bankSymbol"] = oTable.cell(rowIdx, 7).node().childNodes[0].value;
					obj["bankName"] = oTable.cell(rowIdx, 8).node().childNodes[0].value;
					obj["bankAccount"] = oTable.cell(rowIdx, 9).node().childNodes[0].value;
					obj["comment"] = oTable.cell(rowIdx, 10).node().childNodes[0].value;

					data.push(obj);
				}
			});
			
			// Send to server
			$.ajax({
					type: "POST",
					url: "/home/personnel/service-agent/update",
					data: {data : data},
					success: function(result){
						console.log({result});
						$('#editButton').css('display', 'block');
						$('#deleteButton').css('display', 'block');
						$('#saveButton').css('display', 'none');
						$('#cancelButton').css('display', 'none');
						oTable.column(0).visible(true);
						oTable.ajax.reload();
					}

			});
		});

		$('#cancelButton').click(function(e){
			e.preventDefault();
			
			$('#editButton').css('display', 'block');
			$('#deleteButton').css('display', 'block');
			$('#saveButton').css('display', 'none');
			$('#cancelButton').css('display', 'none');
			oTable.column(0).visible(true);

			restoreRow();
		});

		$('#deleteButton').click(function(e){
			e.preventDefault();

			var data = [];

			// Iterate each row in table
			oTable.rows().every( function ( rowIdx, tableLoop, rowLoop ) {

				// Check whether this row has been check
				var rowNode = this.node();
				var isChecked = $(rowNode).hasClass('active');

				if (isChecked) {
					var obj = {};
					obj["id"] = oTable.cell(rowIdx, 0).data();

					data.push(obj);
				}
			});

			// Send to server
			$.ajax({
					type: "POST",
					url: "/home/personnel/service-agent/delete",
					data: {data: data},
					success: function(result){
						console.log({result});
						oTable.ajax.reload();
					}
			});
		});
	};

	// Form init function
	var initForm = function() {

		// When form sumbit
		$('#createButton').click(function(e){
			e.preventDefault();
			$.ajax({
				type: "POST",
				url: "/home/personnel/service-agent/create",
				data: $('#create-form').serialize(), // serializes the form, note it is different from other AJAX in this module
				success: function(result){
					console.log({result});
					oTable.ajax.reload();
				}
			});
		});
	}
	

	return {

		//main function to initiate the module
		init: function() {
			initTable();
			initForm();
		},

	};

}();

jQuery(document).ready(function() {
	DatatablesDataSourceAjaxServer.init();
});