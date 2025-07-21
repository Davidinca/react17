import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/dashboard/Dashboard';

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/login" render={(props) => <Login {...props} />} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/" render={(props) => <Login {...props} />} />
      </Switch>
    </Router>
  );
}

export default App;
