var setFavCol=function(col){
    
    var canvas = document.createElement('canvas'),
        ctx;

    if (canvas.getContext) {
      canvas.height = canvas.width = 16; // set the size
      ctx = canvas.getContext('2d');
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(8,8,7,0,2*Math.PI);
      ctx.closePath();
      ctx.fill();

      var favLink=document.createElement('link');
      favLink.rel='icon';

      favLink.href = canvas.toDataURL('image/png');
      document.body.appendChild(favLink);

    }
}