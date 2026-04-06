import express from 'express'
const port = 3000
const app = express()

app.get('/',(req,res)=>{
    res.send('hello')
})

app.listen(port,()=>{
    console.log(`server is listening at ${port}`)
})