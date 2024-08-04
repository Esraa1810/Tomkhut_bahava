import axios from 'axios';

const addDocumentToBackend = async (document) => {
  try {
    await axios.post('http://localhost:5000/addDocument', document);
  } catch (e) {
    console.error('Error adding document to backend: ', e);
  }
};

export { addDocumentToBackend };
