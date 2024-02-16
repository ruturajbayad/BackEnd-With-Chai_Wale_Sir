import { useEffect, useState } from 'react'
import axios from 'axios';
import './App.css'

function App() {
  const [friends, setFriends] = useState([])
  useEffect(() => {
    axios.get('/api/myfriends')
  .then((response) => {setFriends(response.data)})
  .catch((error) => console.log(error));
  })
  return (
    <>
      <h1>My Amigos</h1>  
      <h4>My Amigos:{friends.length}</h4>
      { 
      friends.map((friend, index) => (
        <div key={friend.id}>
          <h3>{friend.name}</h3>
        </div>
      ))}
    </>
  )
}

export default App
