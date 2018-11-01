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
    }

    

    return {
        //main function to initiate the module
        initPortlet: initPortlet,
    };
}();


jQuery(document).ready(function() {
    Club.initPortlet();
});

function fillEditModal(portletId){
    // Read data from selected portlet
    var pickedPortlet = $('#' + portletId);
    var pickedClubName = pickedPortlet.find('.club-name').html();
    var pickedClubId = pickedPortlet.find('.club-id').html();
    var pickedClubAccount = pickedPortlet.find('.club-account').html();
    
    // Fill it into edit modal
    $('#edit-club-name').val(pickedClubName);
    $('#edit-club-id').val(pickedClubId);
    $('#edit-club-account').val(pickedClubAccount);

}