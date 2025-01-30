import React, { useContext } from 'react';
import { assets } from '../assets/assets.js';
import { AppContext } from '../context/AppContext.jsx';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { userData } = useContext(AppContext);
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login', { state: { mode: 'Sign Up' } }); // Pass state to the Login component
  };

  return (
    <div className='flex flex-col items-center mt-20 px-4 text-center'>
      <img src={assets.header_img} className='w-36 h-36 rounded-full mb-6' />
      <h1 className='flex items-center gap-2 text-xl sm:text-3xl font-medium mb-2'>
        Hey {userData ? userData.name : 'Guest'}!
        <img className='w-8 aspect-square' src={assets.hand_wave} alt="wave" />
      </h1>
      <h2 className='text-3xl sm:text-5xl font-semibold mb-4'>Welcome to our App!</h2>
      <p className='mb-8 max-w-md'>This is a login authenticator website</p>
      <button
        className='border border-gray-500 rounded-full px-8 py-2.5 hover:bg-gray-100 transition-all'
        onClick={handleGetStarted}
      >
        Get Started
      </button>
    </div>
  );
};

export default Header;
