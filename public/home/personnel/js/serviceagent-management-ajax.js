var ServiceAgent = function() {

	var oTable;

	// Data table init function
	var initTable = function() {
		var table = $('#data-table');

		// Init data table
		oTable = table.DataTable({

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
					text: '<i class="fa fa-user-edit"></i> <span>編輯選取</span>',
					attr: {
						id: 'editButton',
						class: 'table-btn btn btn-outline-primary m-btn m-btn--custom m-btn--icon  m-btn--pill m-btn--bolder',
					},
                },
                { 
					text: '<i class="fa fa-user-lock"></i> <span>凍結選取</span>', 
					attr: {
						id: 'frozenButton',
						class: 'table-btn btn btn-outline-danger m-btn m-btn--custom m-btn--icon m-btn--pill m-btn--bolder',
					},
				},
                { 
					text: '<i class="fa fa-user-slash"></i> <span>刪除選取</span>', 
					attr: {
						id: 'deleteButton',
						class: 'table-btn btn btn-danger m-btn m-btn--custom m-btn--icon  m-btn--pill m-btn--air m-btn--bolder ',
					},
				},
				{ 
					text: '<i class="fa fa-save"></i> <span>保存變更</span>', 
					attr: {
						id: 'saveButton',
                        class: 'table-btn btn btn-outline-success m-btn m-btn--custom m-btn--icon  m-btn--pill m-btn--bolder',
                        style: "display:none;",
					},	
                },
				{ 	
					text: '<i class="fa fa-walking"></i> <span>離開編輯</span>', 
					attr: {
						id: 'cancelButton',
						class: 'table-btn btn btn-outline-primary m-btn m-btn--custom m-btn--icon  m-btn--pill m-btn--bolder',
						style: "display:none;",
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


		$('#editButton').click(function(e){
			e.preventDefault();
			
			// Change selected rows from origin format -> input field
			// Iterate each row in table
			var empty = true;
			oTable.rows().every( function ( rowIdx, tableLoop, rowLoop ) {

				// Check whether this row has been check
				var rowNode = this.node();
				var isChecked = $(rowNode).hasClass('active');

				if (isChecked) {
					empty = false;
					var name =oTable.cell(rowIdx, 2).data();
					var lineId = oTable.cell(rowIdx, 3).data();
					var wechatId = oTable.cell(rowIdx, 4).data();
					var facebookId = oTable.cell(rowIdx, 5).data();
					var phoneNumber = oTable.cell(rowIdx, 6).data();
					var bankSymbol = oTable.cell(rowIdx, 7).data();
					var bankName = oTable.cell(rowIdx, 8).data();
					var bankAccount = oTable.cell(rowIdx, 9).data();
					var comment = oTable.cell(rowIdx, 10).data();
					
					//console.log('index is cheched : ' + rowIdx);
					oTable.cell(rowIdx,2).node().innerHTML = `<input type="text" class="form-control input-small" value=${name}>`;
					oTable.cell(rowIdx,3).node().innerHTML = `<input type="text" class="form-control input-small" value=${lineId}>`;
					oTable.cell(rowIdx,4).node().innerHTML = `<input type="text" class="form-control input-small" value=${wechatId}>`;
					oTable.cell(rowIdx,5).node().innerHTML = `<input type="text" class="form-control input-small" value=${facebookId}>`;
					oTable.cell(rowIdx,6).node().innerHTML = `<input type="text" class="form-control input-small" value=${phoneNumber}>`;
					oTable.cell(rowIdx,7).node().innerHTML = `<input type="text" class="form-control input-small" value=${bankSymbol}>`;
					oTable.cell(rowIdx,8).node().innerHTML = `<input type="text" class="form-control input-small" value=${bankName}>`;
					oTable.cell(rowIdx,9).node().innerHTML = `<input type="text" class="form-control input-small" value=${bankAccount}>`;
					oTable.cell(rowIdx,10).node().innerHTML = `<input type="text" class="form-control input-small" value=${comment}>`;
				}
			});

			// If empty then return
			if(empty) {
				return;
			}

			// Change button mode
			editModeButton();
		});

		$('#cancelButton').click(function(e){
			e.preventDefault();
			
			// Restore rows from input field -> origin format
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
					var phoneNumber = oTable.cell(rowIdx, 6).data();
					var bankSymbol = oTable.cell(rowIdx, 7).data();
					var bankName = oTable.cell(rowIdx, 8).data();
					var bankAccount = oTable.cell(rowIdx, 9).data();
					var comment = oTable.cell(rowIdx, 10).data();
					
					//console.log('index is restored : ' + rowIdx);
					oTable.cell(rowIdx,2).node().innerHTML = name;
					oTable.cell(rowIdx,3).node().innerHTML = lineId;
					oTable.cell(rowIdx,4).node().innerHTML = wechatId;
					oTable.cell(rowIdx,5).node().innerHTML = facebookId;
					oTable.cell(rowIdx,6).node().innerHTML = phoneNumber;
					oTable.cell(rowIdx,7).node().innerHTML = bankSymbol;
					oTable.cell(rowIdx,8).node().innerHTML = bankName;
					oTable.cell(rowIdx,9).node().innerHTML = bankAccount;
					oTable.cell(rowIdx,10).node().innerHTML = comment;
				}
			});

			// Change button mode
			normalModeButton();
		});

		$('#saveButton').click(function(e){
			e.preventDefault();

			var thisButton = $(this);

			// Collect selected data
			// Iterate each row in table
			var data = [];
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
					obj["phoneNumber"] = oTable.cell(rowIdx, 6).node().childNodes[0].value;
					obj["bankSymbol"] = oTable.cell(rowIdx, 7).node().childNodes[0].value;
					obj["bankName"] = oTable.cell(rowIdx, 8).node().childNodes[0].value;
					obj["bankAccount"] = oTable.cell(rowIdx, 9).node().childNodes[0].value;
					obj["comment"] = oTable.cell(rowIdx, 10).node().childNodes[0].value;

					data.push(obj);
				}
			});

			// If empty then return
			if(data.length <= 0)	return;

			// Sweet alert, make user confirm
			swal({
                title: '確定保存變更?',
                text: '這項變動將無法復原!',
                type: 'warning',
                showCancelButton: true,
                confirmButtonText: '確定變更',
                cancelButtonText: '不，取消',
                reverseButtons: true
            }).then(function(result){
				// User confirmed
                if (result.value) {

					// Ready to send data
					// Block button
					thisButton.addClass('m-loader m-loader--success m-loader--right')
					.attr('disabled', true);

					// Send to server
					$.ajax({
						type: "POST",
						url: "/home/personnel/service-agent/update",
						data: {data : data},
						success: function(result){
							console.log({result});
							
							// Unblock button
							thisButton.removeClass('m-loader m-loader--success m-loader--right')
							.attr('disabled', false); 

							// Sweet alert
							if(!result.err){

								// Succeed then reload
								oTable.ajax.reload();
								normalModeButton(); // Change button mode

								swal({
									title: "執行成功",
									text: "變更已保存!",
									type: "success",
									confirmButtonText: "OK"
								});
							}
							else{
								swal({
									title: "執行失敗",
									text: result.msg,
									type: "error",
									confirmButtonText: "OK"
								});
							}
						}
					});
				}
				// User did not confirmed
				// result.dismiss can be 'cancel', 'overlay',
				// 'close', and 'timer' 
				else if (result.dismiss === 'cancel') {
                    // swal(
                    //     'Cancelled',
                    //     'Your imaginary file is safe :)',
                    //     'error'
                    // )
                }
            });
		});

		$('#deleteButton').click(function(e){
			e.preventDefault();

			var thisButton = $(this);
			
			// Collect selected data
			// Iterate each row in table
			var data = [];
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

			// If empty then return
			if(data.length <= 0){
				return;
			}

			// Sweet alert, make user confirm
			swal({
                title: '確定刪除 ' + data.length + ' 位客服?',
                text: '這項變動將無法復原!',
                type: 'warning',
                showCancelButton: true,
                confirmButtonText: '確定刪除',
                cancelButtonText: '不，取消',
                reverseButtons: true
            }).then(function(result){
				// User confirmed
                if (result.value) {

					// Ready to send data
					// Block button
					thisButton.addClass('m-loader m-loader--danger m-loader--right')
					.attr('disabled', true);

					// Send to server
					$.ajax({
						type: "POST",
						url: "/home/personnel/service-agent/delete",
						data: {data: data},
						success: function(result){
							console.log({result});
							oTable.ajax.reload();
							
							// Unblock button
							thisButton.removeClass('m-loader m-loader--danger m-loader--right')
							.attr('disabled', false);

							// Sweet alert
							if(!result.err){
								swal({
									title: "執行成功",
									text: "客服人員已刪除!",
									type: "success",
									confirmButtonText: "OK"
								});
							}
							else{
								swal({
									title: "執行失敗",
									text: result.msg,
									type: "error",
									confirmButtonText: "OK"
								});
							}

						}
					});
				}
				// User did not confirmed
				// result.dismiss can be 'cancel', 'overlay',
				// 'close', and 'timer' 
				else if (result.dismiss === 'cancel') {
                    // swal(
                    //     'Cancelled',
                    //     'Your imaginary file is safe :)',
                    //     'error'
                    // )
                }
            });

			

			
		});

		function editModeButton(){
			oTable.column(0).visible(false);
            $('#saveButton').css('display', 'inline');
			$('#cancelButton').css('display', 'inline');

			$('#editButton').css('display', 'none');
			$('#frozenButton').css('display', 'none');
			$('#deleteButton').css('display', 'none');
		}
		function normalModeButton(){
			$('#editButton').css('display', 'inline');
			$('#frozenButton').css('display', 'inline');
			$('#deleteButton').css('display', 'inline');

            $('#saveButton').css('display', 'none');
			$('#cancelButton').css('display', 'none');
			oTable.column(0).visible(true);
		}
	};

	var initForm = function() {
		// http://jqueryvalidation.org/validate/

		// Custom email validator, the original one is like shit(cannot allow blank)
		$.validator.methods.email = function( value, element ) {
			console.log(value);
			return this.optional( element ) ||  /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/.test( value ) ;
		  }
		
		// Set up validator for form
		$( '#create-form' ).validate({
            // define validation rules
            rules: {
                name: {
					required: true,
					maxlength: 20
                },
                account: {
					required: true,
					maxlength: 20
                },
                password: {
					required: true,
					maxlength: 20
                },
                passwordConfirm: {
                    required: true,
					equalTo: "#password",
					maxlength: 20
                },
                email: {
					email: true,
					maxlength: 40
                },
                bankSymbol: {
					digits: true,
					maxlength: 20
                },
                bankName: {
					maxlength: 20
                },
                bankAccount: {
					digits: true,
					maxlength: 20
                },
                phoneNumber: {
					digits: true,
					maxlength: 20
                },
                facebookId: {
					maxlength: 20
                },
                lineId: {
					maxlength: 20
				},
				wechatId: {
					maxlength: 20
				},
				comment: {
					maxlength: 40
                },
            },
			
			// custom invalid messages
			messages: { 
				name: {
					required: '名稱為必填欄位',
					maxlength: '長度不可超過 20'
                },
                account: {
					required: '帳號為必填欄位',
					maxlength: '長度不可超過 20'
                },
                password: {
					required: '密碼為必填欄位',
					maxlength: '長度不可超過 20'
                },
                passwordConfirm: {
                    required: '確認密碼為必填欄位',
					equalTo: '請輸入相同的密碼',
					maxlength: '長度不可超過 20'
                },
                email: {
					email: '請輸入正確的 email 格式',
					maxlength: '長度不可超過 40'
                },
                bankSymbol: {
					digits: '必須是數字',
					maxlength: '長度不可超過 20'
                },
                bankName: {
					maxlength: '長度不可超過 20'
                },
                bankAccount: {
					digits: '必須是數字',
					maxlength: '長度不可超過 20'
                },
                phoneNumber: {
					digits: '必須是數字',
					maxlength: '長度不可超過 20'
                },
                facebookId: {
					maxlength: '長度不可超過 20'
                },
                lineId: {
					maxlength: '長度不可超過 20'
				},
				wechatId: {
					maxlength: '長度不可超過 20'
				},
				comment: {
					maxlength: '長度不可超過 40'
                },
			},

            //display error alert on form submit  
            invalidHandler: function(event, validator) {  
                
                swal({
                    "title": "欄位資料錯誤", 
                    "text": "請更正錯誤欄位後再試一次", 
                    "type": "error",
                    confirmButtonText: "OK"
                });
                
            },

            submitHandler: function (form) {

				// Ready to send data
				// Block modal
				mApp.block('#create-modal .modal-content', {
					size: 'lg',
					type: 'loader',
					state: 'primary',
					message: '新增中...'
				});

				$.ajax({
					type: "POST",
					url: "/home/personnel/service-agent/create",
					data: $(form).serialize(), // serializes the form, note it is different from other AJAX in this module
					success: function(result){
						console.log(result);
						
						mApp.unblock('#create-modal .modal-content'); // Unblock button
						
						// Sweet alert
						if(!result.err){

							$('#create-modal').modal('hide');  // close form modal
							oTable.ajax.reload(); // reload table data

							swal({
								title: "執行成功",
								text: "客服人員已新增!",
								type: "success",
								confirmButtonText: "OK"
							});
						}
						else{
							swal({
								title: "執行失敗",
								text: result.msg,
								type: "error",
								confirmButtonText: "OK"
							});
						}
					}
				});
            }
        });     
	}
	

	return {
		initTable: initTable,
		initForm:  initForm
	};

}();

jQuery(document).ready(function() {
	ServiceAgent.initTable();
	ServiceAgent.initForm();
});