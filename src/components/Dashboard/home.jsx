import React from 'react'
import Outer_Navbar from '../Outer_Navbar'
import AuthForm from './auth'
import Dashboard from './dashboard'

function Landing_Page() {
  return (
    <div>
      <Outer_Navbar />
      <div id = "dashboard"> <Dashboard/> </div>
      <div id="auth"> <AuthForm/>  </div>
    </div>
  )
}

export default Landing_Page;
