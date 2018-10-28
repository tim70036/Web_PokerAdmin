var BlockUI = function() {

    var init = function() {

        // Block modal when submiting form
        $('#createButton').click(function(){
            mApp.block('#create-modal .modal-content', {
                size: 'lg',
                type: 'loader',
                state: 'primary',
                message: ''
            });
        });

        // Block delete button when click
        $('#deleteButton').click(function(){
            $('#deleteButton').addClass('m-loader m-loader--danger m-loader--right')
                              .attr('disabled', true);
        });

        // Block save button when click
        $('#saveButton').click(function(){
            $('#saveButton').addClass('m-loader m-loader--success m-loader--right')
                              .attr('disabled', true);
        });
    }

    var unBlock = function() {

        // Unblock all UI
        
        mApp.unblock('#create-modal .modal-content');

        $('#deleteButton').removeClass('m-loader m-loader--danger m-loader--right')
                          .attr('disabled', false);

        $('#saveButton').removeClass('m-loader m-loader--success m-loader--right')
                        .attr('disabled', false);

        
    }

    return {
        init: init,
        unBlock: unBlock
    };
}();

jQuery(document).ready(function() {    
    BlockUI.init();
});