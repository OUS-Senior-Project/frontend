import { useState } from 'react';
import './App.css';
import { fetchItems } from './api/items';

function App() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('Click the button to hit the API.');

  const hitApi = async () => {
    setLoading(true);
    setMessage('Contacting API…');
    try {
      const data = await fetchItems();
      setMessage(
        `Success. Retrieved ${Array.isArray(data) ? data.length : 0} items.`
      );
    } catch (err) {
      setMessage(`Error: ${err.message || 'Unable to reach API'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>API Check</h1>
      <p className="hint">
        FastAPI route: GET http://127.0.0.1:8000/api/v1/items
      </p>
      <button onClick={hitApi} disabled={loading}>
        {loading ? 'Calling…' : 'Hit API'}
      </button>
      <p className="status">{message}</p>
    </div>
  );
}

export default App;
