var Club = function () {

    function initPortlet() {
        $("#m_sortable_portlets").sortable({
            connectWith: ".m-portlet__head",
            items: ".m-portlet",
            opacity: 0.8,
            handle : '.m-portlet__head',
            coneHelperSize: true,
            placeholder: 'm-portlet--sortable-placeholder',
            forcePlaceholderSize: true,
            tolerance: "pointer",
            helper: "clone",
            tolerance: "pointer",
            forcePlaceholderSize: !0,
            helper: "clone",
            cancel: ".m-portlet--sortable-empty", // cancel dragging if portlet is in fullscreen mode
            revert: 250, // animation in milliseconds
            update: function(b, c) {
                if (c.item.prev().hasClass("m-portlet--sortable-empty")) {
                    c.item.prev().before(c.item);
                }
            }
        });
    };

     function initForm() {


        $('#add-form').validate({
            // define validation rules
            rules: {
                addaccount: {
                    required: true,
                    maxlength: 20
                },
                addpassword: {
                    required: true,
                    maxlength: 20
                }
            },

            // custom invalid messages
            messages: {
                addaccount: {
                    required: '帳號為必填欄位',
                    maxlength: '長度不可超過20'
                },
                addpassword: {
                    required: '密碼為必填欄位',
                    maxlength: '長度不可超過20'
                }
            },

            // display error alert on form submit
            invalidHandler: function(event, validator) {

                swal({
                    "title" : "欄位資料錯誤",
                    "text" : "請更正錯誤後再試一次",
                    "type" : "error",
                    confirmButtonText: "OK"
                });
            },

            submitHandler: function (form) {

                // Ready to send data
                // Block modal
                mApp.block('#add-modal .modal-content', {
                    size: 'lg',
                    type: 'loader',
                    state: 'primary',
                    message: '新增中...'
                });

                $.ajax({
                    type: "POST",
                    url: "/home/account/club/create",
                    data: $(form).serialize(), // serializes the form, note it is different from other AJAX in this module
                    success: function(result) {
                        console.log(result);

                        mApp.unblock('#add-modal .modal-content'); // Unblock button

                        // Sweet alert
                        if(!result.err) {

                            $('#add-modal').modal('hide'); // close form modal
                            location.reload();

                            swal({
                                title: "執行成功",
                                text: "CMS帳號已新增",
                                type: "success",
                                confirmButtonText: "OK"
                            });
                        }
                        else {
                            $('#add-modal').modal('hide');
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
        //main function to initiate the module
        initPortlet: initPortlet,
        initForm: initForm
    };
}();


jQuery(document).ready(function() {
    Club.initPortlet();
    Club.initForm();
});



function deleteAccount(portletId) {
    let targetId = $('#' + portletId).find('.club-id').html();
    let targetaccount = $('#' + portletId).find('.club-account').html();
    swal({
        title: '確定刪除 ' + targetId + ' ?',
        text: "You won't be able to revert this!",
        type: 'warning',
        showCancelButton: true,
        confirmButtonText: '確定刪除',
        cancelButtonText: '取消',
        reverseButtons: true
    }).then(function(result){
        if (result.value) {
          console.log("delete : " + targetId);
          console.log("delete account : " + targetaccount);
            mApp.block('#edit-modal .modal-content', {
                size: 'lg',
                type: 'loader',
                state: 'primary',
                message: '刪除中...'
            });

            $.ajax({
                    type: "POST",
                    url: "/home/account/club/delete",
                    data: { 'clubid': targetId, 'cmsaccount': targetaccount}, // serializes the form, note it is different from other AJAX in this module
                    success: function(result) {
                        console.log(result);

                        mApp.unblock('#edit-modal .modal-content'); // Unblock button

                        // Sweet alert
                        if(!result.err) {

                            //$('#edit-modal').modal('hide'); // close form modal
                            location.reload();

                            swal({
                                title: "執行成功",
                                text: "CMS帳號已刪除",
                                type: "success",
                                confirmButtonText: "OK"
                            });
                        }
                        else {
                            swal({
                                title: "執行失敗",
                                text: result.msg,
                                type: "error",
                                confirmButtonText: "OK"
                            });
                        }
                    }
                });

            // swal(
            //     'Deleted!',
            //     'Your file has been deleted.',
            //     'success'
            // )
            // result.dismiss can be 'cancel', 'overlay',
            // 'close', and 'timer'
        } else if (result.dismiss === 'cancel') {
            swal(
                'Cancelled',
                'Your imaginary file is safe :)',
                'error'
            )
        }
    });
}
