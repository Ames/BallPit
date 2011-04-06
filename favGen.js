var favLink;

var setFavCol=function(col,notify){
    
    var canvas = document.createElement('canvas'),
        ctx;
    if (canvas.getContext) {
      canvas.height = canvas.width = 16; // set the size
      ctx = canvas.getContext('2d');
      if(notify){
          ctx.fillStyle = "black";
          ctx.beginPath();
          ctx.arc(8,8,8,0,2*Math.PI);
          ctx.closePath();
      }
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(8,8,7,0,2*Math.PI);
      ctx.closePath();
      ctx.fill();


		//var head=document.getElementsByTagName('head')[0];
		var head=document.getElementsByTagName('body')[0];

		if(!favLink){
			favLink=document.createElement('link');
			favLink.rel='icon';
		}else{
			head.removeChild(favLink);
		}

	//I think we have caching issues

      favLink.href = canvas.toDataURL('image/png');
		head.appendChild(favLink);
    }
}