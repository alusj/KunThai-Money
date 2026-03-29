import { useNavigate } from "react-router-dom"
import FloatingCurrencyBackground from "../components/animations/FloatingCurrencyBackground"
import Logo3DGlow from "../components/Logo3DGlow"
import PageTransition from "../components/animations/PageTransition"

export default function WelcomeScreen(){

const navigate = useNavigate()

return(

<PageTransition>

<div
className="
relative
min-h-screen
flex
flex-col
items-center
justify-center
px-6
text-white
bg-gradient-to-br
from-indigo-900
via-blue-700
to-indigo-800
overflow-hidden
"
>
  <h1 className="text-4xl font-bold mb-14">
KunThai Money
</h1>

<FloatingCurrencyBackground/>

<Logo3DGlow/>



<p className="text-blue-100 mb-8 text-center">
Move Money Beyond Borders
</p>

<button
onClick={()=>navigate("/register")}
className="
w-full
max-w-xs
bg-white
text-indigo-700
py-3
rounded-xl
font-semibold
shadow-xl
transition
hover:scale-105
active:scale-95
mb-4
"
>
Register
</button>

<button
onClick={()=>navigate("/login")}
className="
w-full
max-w-xs
border
border-white/30
py-3
rounded-xl
font-semibold
transition
hover:bg-white/10
hover:scale-105
active:scale-95
"
>
Login
</button>

</div>

</PageTransition>

)

}
