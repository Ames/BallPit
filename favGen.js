var favLink;

var setFavCol=function(col,notify){
	
	var canvas = document.createElement('canvas'), ctx;
	
	if (canvas.getContext) {
		canvas.height = canvas.width = 16; // set the size
		ctx = canvas.getContext('2d');
		ctx.fillStyle = col;
        ctx.beginPath();
		if(notify){
            ctx.fillStyle = "black";
            ctx.arc(8,8,7,0,2*Math.PI);
            ctx.closePath();
            ctx.fill();
            ctx.beginPath();
            ctx.fillStyle = col;
            //ctx.moveTo(8,8);
            var n = notify;
            var radS = 3.5;
            var radL = 8;
            for(var i=0;i<2*n;i++){
                var r = i%2?radS:radL;
                var a = Math.PI/n*i; 
                ctx.lineTo(8+r*Math.sin(a),8-r*Math.cos(a));
            }
        }else{
        	ctx.arc(8,8,7,0,2*Math.PI);
        }
        ctx.closePath()
        ctx.fill()
		
		var head=document.getElementsByTagName('head')[0];
		//var head=document.getElementsByTagName('body')[0];
		
		if(!favLink){
			favLink=document.createElement('link');
			favLink.rel='icon';
			favLink.type = "image/png";  //this fixed it.
			head.appendChild(favLink);
		}
		
		favLink.href = canvas.toDataURL('image/png');
	}
}

var removeFav=function(){
	var head=document.getElementsByTagName('head')[0];
	
	head.removeChild(favLink);
	favLink=undefined;
}
