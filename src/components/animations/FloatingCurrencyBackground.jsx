import { useEffect, useState } from "react"

const currencies = ["₦","₵","SLL","CFA","L$"]

export default function FloatingCurrencyBackground(){

const [items,setItems] = useState([])

useEffect(()=>{

const newItems = Array.from({length:25}).map((_,i)=>({
id:i,
symbol:currencies[Math.floor(Math.random()*currencies.length)],
left:Math.random()*100,
delay:Math.random()*15,
size:20+Math.random()*30
}))

setItems(newItems)

},[])

return(

<div className="absolute inset-0 overflow-hidden pointer-events-none">

{items.map(item=>(
<span
key={item.id}
className="absolute text-white/20 animate-float"
style={{
left:`${item.left}%`,
fontSize:item.size,
animationDelay:`${item.delay}s`
}}
>
{item.symbol}
</span>
))}

</div>

)

}
