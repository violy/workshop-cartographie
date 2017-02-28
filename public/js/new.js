jQuery(document).ready(function($){

    var meta,uid;
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
            meta = data;
            uid = meta.uid;
            $('#new-map').attr('href','/map/'+uid);
            $('#build-progress').val(10);
            setTimeout(BuildZoom,100)

        }).fail(function(err){
            alert(err.responseJSON.error);
            $form.fadeIn();
            $('.waiting').hide();
        });

    });
    // fabrique un calque
    function BuildZoom(){
        $.ajax({
            method:'POST',
            dataType: 'json', // selon le retour attendu
            url:'build-zoom/'+uid,
        }).done(function(data){
            $('#build-progress').val(50);
            BuildCache(0);
        }).fail(function(err){
            console.log(err);
        });
    }
    // fabrique un cache
    function BuildCache(level){


        if(level>=meta.minZoom){
            $('.waiting').fadeOut();
            $('.complete').fadeIn();
            return;
        }


        $.ajax({
            dataType: 'json', // selon le retour attendu
            url:'build-cache/'+uid+'/'+level,
        }).done(function(data){
            $('#build-progress').val(60+40*level/meta.minZoom);
            BuildCache(level+1);
        }).fail(function(err){
            console.log(err);
        });
    }
});