var DatatablesDataSourceAjaxServer = function() {

	var initTable1 = function() {
		var table = $('#m_table_1');

		// begin first table
		var oTable = table.DataTable({
			responsive: true,
			searchDelay: 500,
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

			buttons: [
				{ 
					text: '編輯',
					attr: {
						id: 'editButton',
						class: 'btn m-btn--pill    btn-outline-primary',
						style: "display:block; margin-right:0.5em;"
					},
				},

				{ 
					text: '保存', 
					attr: {
						id: 'saveButton',
						class: 'btn m-btn--pill    btn-outline-primary',
						style: "display:none; margin-right:0.5em;"
					},	
				},
				{ 
					text: '取消', 
					attr: {
						id: 'cancelButton',
						class: 'btn m-btn--pill    btn-outline-primary',
						style: "display:none; margin-right:0.5em;"
					},
				},
				{ 
					text: '刪除', 
					attr: {
						id: 'deleteButton',
						class: 'btn m-btn--pill    btn-outline-primary',
						style: "display:block; margin-right:0.5em;"
					},
				},
			],
			
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
				{data: 'quota'},
				{data: 'credit'},
				{data: 'comment'},
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

		table.on('change', 'tbody tr .m-checkbox', function() {
			$(this).parents('tr').toggleClass('active');
		});

		//restore rows from input field -> origin
		function restoreRow(){

			var rows = oTable.column(0).nodes().to$();

			$(rows).each(function(index, element){
				let set = $(element).find('.m-checkable');
				let checked = $(set).is(':checked');
				if(checked){
					let name =oTable.cell(index, 2).data();
					let lineId = oTable.cell(index, 3).data();
					let wechatId = oTable.cell(index, 4).data();
					let facebookId = oTable.cell(index, 5).data();
					let phone = oTable.cell(index, 6).data();
					let bankSymbol = oTable.cell(index, 7).data();
					let bankName = oTable.cell(index, 8).data();
					let bankAccount = oTable.cell(index, 9).data();
					let cashQuota = oTable.cell(index, 10).data();
					let creditQuota = oTable.cell(index, 11).data();
					let comment = oTable.cell(index, 12).data();
					
					oTable.cell(index,2).node().innerHTML = name;
					oTable.cell(index,3).node().innerHTML = lineId;
					oTable.cell(index,4).node().innerHTML = wechatId;
					oTable.cell(index,5).node().innerHTML = facebookId;
					oTable.cell(index,6).node().innerHTML = phone;
					oTable.cell(index,7).node().innerHTML = bankSymbol;
					oTable.cell(index,8).node().innerHTML = bankName;
					oTable.cell(index,9).node().innerHTML = bankAccount;
					oTable.cell(index,10).node().innerHTML = cashQuota;
					oTable.cell(index,11).node().innerHTML = creditQuota;
					oTable.cell(index,12).node().innerHTML = comment
				}				
			});
		};
		// change selected rows from origin -> input field
		function editRow(){
			var rows = oTable.column(0).nodes().to$();

			$(rows).each(function(index, element) {
				let set = $(element).find('.m-checkable');
				let checked = $(set).is(':checked');
				
				if (checked) {
					let name =oTable.cell(index, 2).data();
					let lineId = oTable.cell(index, 3).data();
					let wechatId = oTable.cell(index, 4).data();
					let facebookId = oTable.cell(index, 5).data();
					let phone = oTable.cell(index, 6).data();
					let bankSymbol = oTable.cell(index, 7).data();
					let bankName = oTable.cell(index, 8).data();
					let bankAccount = oTable.cell(index, 9).data();
					let cashQuota = oTable.cell(index, 10).data();
					let creditQuota = oTable.cell(index, 11).data();
					let comment = oTable.cell(index, 12).data();

					oTable.cell(index,2).node().innerHTML = `<input type="text" class="form-control input-small" value=${name}>`;
					oTable.cell(index,3).node().innerHTML = `<input type="text" class="form-control input-small" value=${lineId}>`;
					oTable.cell(index,4).node().innerHTML = `<input type="text" class="form-control input-small" value=${wechatId}>`;
					oTable.cell(index,5).node().innerHTML = `<input type="text" class="form-control input-small" value=${facebookId}>`;
					oTable.cell(index,6).node().innerHTML = `<input type="text" class="form-control input-small" value=${phone}>`;
					oTable.cell(index,7).node().innerHTML = `<input type="text" class="form-control input-small" value=${bankSymbol}>`;
					oTable.cell(index,8).node().innerHTML = `<input type="text" class="form-control input-small" value=${bankName}>`;
					oTable.cell(index,9).node().innerHTML = `<input type="text" class="form-control input-small" value=${bankAccount}>`;
					oTable.cell(index,10).node().innerHTML = `<input type="text" class="form-control input-small" value=${cashQuota}>`;
					oTable.cell(index,11).node().innerHTML = `<input type="text" class="form-control input-small" value=${creditQuota}>`;
					oTable.cell(index,12).node().innerHTML = `<input type="text" class="form-control input-small" value=${comment}>`;
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
			
			var rows = oTable.column(0).nodes().to$();
			let data = [];

			$(rows).each(function(index, element){
				let set = $(element).find('.m-checkable');
				let checked = $(set).is(':checked');
				if(checked){
					let obj = {};
					obj["id"] = oTable.cell(index, 0).data();
					obj["name"] = oTable.cell(index, 2).node().childNodes[0].value;
					obj["lineId"] = oTable.cell(index, 3).node().childNodes[0].value;
					obj["wechatId"] = oTable.cell(index, 4).node().childNodes[0].value;
					obj["facebookId"] = oTable.cell(index, 5).node().childNodes[0].value;
					obj["phone"] = oTable.cell(index, 6).node().childNodes[0].value;
					obj["bankSymbol"] = oTable.cell(index, 7).node().childNodes[0].value;
					obj["bankName"] = oTable.cell(index, 8).node().childNodes[0].value;
					obj["bankAccount"] = oTable.cell(index, 9).node().childNodes[0].value;
					obj["cashQuota"] = oTable.cell(index, 10).node().childNodes[0].value;
					obj["creditQuota"] = oTable.cell(index, 11).node().childNodes[0].value;
					obj["comment"] = oTable.cell(index, 12).node().childNodes[0].value;

					data.push(obj);
				}
				
			});

			//console.log({data});
			
			$.ajax({
					type: "POST",
					url: "/home/personnel/service-agent/update",
					data: {
						data: data
					},
					success: function(result){
						console.log({result});
						$('#editButton').css('display', 'block');
						$('#deleteButton').css('display', 'block');
						$('#saveButton').css('display', 'none');
						$('#cancelButton').css('display', 'none');
						oTable.column(0).visible(true);
						oTable.ajax.reload();
						//oTable.draw();
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
			var rows = oTable.column(0).nodes().to$();
			let data = [];

			$(rows).each(function(index, element){
				let set = $(element).find('.m-checkable');
				let checked = $(set).is(':checked');
				if(checked){
					let obj = {};
					obj["id"] = oTable.cell(index, 0).data();
				
					data.push(obj);
				}
				
			});

			//console.log({data});
			
			$.ajax({
					type: "POST",
					url: "/home/personnel/service-agent/delete",
					data: {
						data: data
					},
					success: function(result){
						console.log({result});
						oTable.ajax.reload();
						//oTable.draw();
					}

			});
		});
	};

	

	return {

		//main function to initiate the module
		init: function() {
			initTable1();
		},

	};

}();

jQuery(document).ready(function() {
	DatatablesDataSourceAjaxServer.init();
});