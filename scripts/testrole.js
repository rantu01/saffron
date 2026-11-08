require("dotenv").config();
const email="rantu@gmail.com", password="123456", apiKey=process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
(async()=>{
  const r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password,returnSecureToken:true})});
  const d=await r.json();
  const res=await fetch("http://localhost:3000/api/auth/role",{headers:{Authorization:`Bearer ${d.idToken}`}});
  console.log("status",res.status);
  console.log(await res.text());
})();