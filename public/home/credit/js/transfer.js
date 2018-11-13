var Transfer = function() {

	var initForm = function() {

		// Select 2
        $('#accountFrom').select2({
            placeholder: "請選擇歸屬的代理",
		});
		$('#accountTo').select2({
            placeholder: "請選擇歸屬的代理",
		});
		
		// Form Validate
		// http://jqueryvalidation.org/validate/
		// Custom alphaNumeric validator
		$.validator.methods.alphaNumeric = function( value, element ) {
			console.log(value);
			return this.optional( element ) ||  /^[a-z0-9]+$/i.test( value ) ;
		}
		
		// Set up validator for form
		$( '#transfer-form' ).validate({
            // define validation rules
            rules: {
                accountFrom: {
					required: true,
                },
                accountTo: {
					required: true,
				},
				amount: {
					required: true,
					number: true
                },
                password: {
					required: true,
					maxlength: 20,
					alphaNumeric: true,
                },
                comment: {
					maxlength: 40
                },
            },
			
			// custom invalid messages
			messages: { 
				accountFrom: {
					required: '轉出帳號為必填欄位',
                },
                accountTo: {
					required: '轉入帳號為必填欄位',
				},
				amount: {
					required: '轉帳金額為必填欄位',
					number: '必須是整數'
                },
                password: {
					required: '確認密碼為必填欄位',
					maxlength: '長度不可超過 20',
					alphaNumeric: '必須是數字或英文字母',
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
				// Block UI
				mApp.block('#transfer-portlet', {
					size: 'lg',
					type: 'loader',
					state: 'primary',
					message: '轉帳中...'
				});

				$.ajax({
					type: "POST",
					url: "/home/credit/transfer",
					data: $(form).serialize(), // serializes the form, note it is different from other AJAX in this module
					success: function(result){
						console.log(result);
						
						mApp.unblock('#transfer-portlet'); // Unblock 
						
						// Sweet alert
						if(!result.err){

							$('#create-modal').modal('hide');  // close form modal
							oTable.ajax.reload(); // reload table data

							swal({
								title: "執行成功",
								text: "轉帳已完成!",
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
    };
	

	return {
		initForm:  initForm
	};

}();

jQuery(document).ready(function() {
	Transfer.initForm();
});