jQuery(document).ready(function($){
    var uid = $('.tools').data('uid');
   $('.build-cache').click(function(){
       var $el = $(this),
           zoom = $el.data('zoom'),
           t0 = new Date().getTime();
       $el.attr('disabled',true);
       $.ajax({
           url:'build-cache/'+uid+'/'+zoom
       }).done(function(a,b,c){
           $el.removeAttr('disabled');
           $el.attr('data-duration',(new Date().getTime()-t0)/1000);
       });
   });
});