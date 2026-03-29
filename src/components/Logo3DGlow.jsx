export default function Logo3DGlow(){

return(

<div className="relative flex items-center justify-center mb-7">

{/* glow */}

<div className="
absolute
w-52
h-52
bg-blue-500/100
blur-xl
rounded-full
animate-pulse
"></div>


{/* logo */}

<div
className="
relative
w-40
h-50
rounded-3xl
bg-white/15
backdrop-blur-xxl
border
border-black/200
flex
items-center
justify-center
shadow-xl
">

<span className="text-8xl font-bold text-white">
K
</span>

</div>

</div>

)

}