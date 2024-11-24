import React, { useState } from 'react';
import Button from './Button';
import Logo from './Logo';
import { Navigate } from 'react-router-dom';

const AppInfo = ({ className }) => {
  const [isDevXP, setIsDevXP] = useState(false);

  // fetch version, autorun, and other info from github
  // fetch('https://api.github.com/repos/username/repo/releases/latest')

  const getInfoFromGithub = async () => {
    try {
      const response = await fetch('https://api.github.com/repos/username/repo/releases/latest');
      const data = await response.json();
      console.log(data);
      console.log(data);
    } catch (error) {
      console.error('Error fetching data from Github:', error);
    }
  };


  return (
    <div data-component="AppInfo" className={`flex text-white flex-col items-start justify-center h-full p-4 border-2 rounded-lg bg-blue-500 border-blue-900 ${className}`}>
      <div>
        <Logo color="text-white" className="mb-4 text-white" />
      </div>
      <h1 className="text-2xl font-bold mb-4">Welcome to DevXP</h1>
      <p className=" mb-4">DevXP is a developer experience platform that helps you build, test, and deploy your applications with ease.</p>
      <Button asLink={true} target="_blank" href="https://lucamack.at" className='px-3 border-blue-900'>Get Started</Button>

    </div>
  );
}

export default AppInfo;
