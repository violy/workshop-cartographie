jQuery(document).ready(function($){
    $('#new-form').submit(function(e){
        e.preventDefault();
        e.stopPropagation();

        var $form = $('#new-form'),
            labelNotOk = $form.find('label:not(.ok)');

        if(labelNotOk.length > 1){
            var current = labelNotOk.first();
            current.removeClass('current').addClass('ok');
            current.next().addClass('current');
            return;
        }

        var formdata = (window.FormData) ? new FormData($form[0]) : null;
        var data = (formdata !== null) ? formdata : $form.serialize();
        console.log(data);

        $form.fadeOut();

        $.ajax({
            url: $form.attr('action'),
            method: $form.attr('method'),
            type: $form.attr('method'),
            contentType: false, // obligatoire pour de l'upload
            processData: false, // obligatoire pour de l'upload
            dataType: 'json', // selon le retour attendu
            data: data
        }).done(function(data){
            $('#new-map').attr('href','/map/'+data.uid);
            $('.complete').fadeIn();
        }).fail(function(err){
            console.log(err)
        });

    });
});