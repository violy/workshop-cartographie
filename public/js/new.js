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
        $('.waiting').fadeIn();

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
            $('#build-progress').val(10);
            //setTimeout(function(){
                BuildZoom(data.uid);
                //}
               // ,1000);
        }).fail(function(err){
            console.log()
            alert(err.responseJSON.error);
            $form.fadeIn();
            $('.waiting').hide();
        });

    });
    // fabrique un calque
    function BuildZoom(uid){
        $.ajax({
            method:'POST',
            dataType: 'json', // selon le retour attendu
            url:'build-zoom/'+uid,
        }).done(function(data){
            $('#build-progress').val(50);
            BuildCache(uid,0);
        }).fail(function(err){
            console.log(err);
        });
    }
    // fabrique un cache
    function BuildCache(uid,level){
        $.ajax({
            method:'POST',
            dataType: 'json', // selon le retour attendu
            url:'build-cache/'+uid+'/'+level,
        }).done(function(data){
            $('#build-progress').val(60);
            BuildCache(uid);
        }).fail(function(err){
            console.log(err);
        });
    }
});