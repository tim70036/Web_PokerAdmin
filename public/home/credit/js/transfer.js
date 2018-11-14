var Transfer = function() {

	var initForm = function() {

		
        $('#accountFrom').select2({
			data: accountOptions,
			placeholder: "請選擇轉出帳號",
			templateResult: function(data) {return data.html},
			templateSelection: function(data) {return data.text},
			escapeMarkup: function(markup) {return markup;},
		});
		$('#accountTo').select2({
			data: accountOptions,
			placeholder: "請選擇轉入帳號",
			templateResult: function(data) {return data.html},
			templateSelection: function(data) {return data.text},
			escapeMarkup: function(markup) {return markup;},
		});


		// Form Validate
		// http://jqueryvalidation.org/validate/
		// Custom alphaNumeric validator
		$.validator.methods.alphaNumeric = function( value, element ) {
			return this.optional( element ) ||  /^[a-z0-9]+$/i.test( value ) ;
		}
		// Custom notEqual validator
		$.validator.methods.notEqual = function( value, element, param ) {
			return this.optional( element ) ||  value !=  $(param).val() ;
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
					notEqual: '#accountFrom',
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
					notEqual: '轉入帳號不能跟轉出帳號相同',
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