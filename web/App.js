import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native-web';
import AsyncStorage from '@react-native-async-storage/async-storage';
import hadiths from '../sahih_bukhari.json';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  hadith: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    maxWidth: 800,
    lineHeight: 1.6,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  source: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
    fontStyle: 'italic',
  },
  narrator: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  volume: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  }
});

const App = () => {
  const [hadith, setHadith] = useState('');
  const [source, setSource] = useState('');
  const [narrator, setNarrator] = useState('');
  const [volume, setVolume] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getRandomHadith = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to get cached hadith first
      const cachedHadith = await AsyncStorage.getItem('dailyHadith');
      const cachedSource = await AsyncStorage.getItem('hadithSource');
      const cachedNarrator = await AsyncStorage.getItem('hadithNarrator');
      const cachedVolume = await AsyncStorage.getItem('hadithVolume');
      const cachedTimestamp = await AsyncStorage.getItem('hadithTimestamp');
      
      // Use cache if it's less than 24 hours old
      if (cachedHadith && cachedTimestamp && (Date.now() - parseInt(cachedTimestamp)) < 24 * 60 * 60 * 1000) {
        setHadith(cachedHadith);
        setSource(cachedSource || '');
        setNarrator(cachedNarrator || '');
        setVolume(cachedVolume || '');
        setLoading(false);
        return;
      }

      // Get random hadith from local JSON
      const randomIndex = Math.floor(Math.random() * hadiths.length);
      const randomHadith = hadiths[randomIndex];
      
      // Cache the hadith with timestamp
      await AsyncStorage.setItem('dailyHadith', randomHadith.text);
      await AsyncStorage.setItem('hadithSource', `Sahih al-Bukhari, Hadith ${randomIndex + 1}`);
      await AsyncStorage.setItem('hadithNarrator', `Narrated by ${randomHadith.by}`);
      await AsyncStorage.setItem('hadithVolume', randomHadith.info);
      await AsyncStorage.setItem('hadithTimestamp', Date.now().toString());
      
      setHadith(randomHadith.text);
      setSource(`Sahih al-Bukhari, Hadith ${randomIndex + 1}`);
      setNarrator(`Narrated by ${randomHadith.by}`);
      setVolume(randomHadith.info);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getRandomHadith();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Daily Hadith</Text>
      {loading ? (
        <Text>Loading...</Text>
      ) : error ? (
        <Text>Error: {error}</Text>
      ) : (
        <>
          <Text style={styles.hadith}>{hadith}</Text>
          <Text style={styles.source}>{source}</Text>
          <Text style={styles.narrator}>{narrator}</Text>
          <Text style={styles.volume}>{volume}</Text>
          <TouchableOpacity style={styles.button} onPress={getRandomHadith}>
            <Text style={styles.buttonText}>Get New Hadith</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default App; 