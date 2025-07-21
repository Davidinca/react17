import React from 'react';
import { Redirect } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const ProtectedRoute = ({ children, ...rest }) => {
  const { user } = useAuth();

  return user ? (
    <div {...rest}>{children}</div>
  ) : (
    <Redirect to={{ pathname: '/login', state: { from: rest.location } }} />
  );
};

export default ProtectedRoute;
