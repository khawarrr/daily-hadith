import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  Share, 
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
  Button
} from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// Web-specific notification handling
const isWeb = Platform.OS === 'web';

// API Configuration
// Using a more complete API key format and adding fallback mechanism
const API_KEY = '$2y$10$HOblM1JanZXAx4y8GkccOlOYD4LF0Clwq3yi7vxhoELtPltd2Uu';
const API_URL = 'https://hadithapi.com/api/hadiths';

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Function to get current date in format "DD Month YYYY"
const getFormattedDate = () => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const date = new Date();
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

// Fallback hadiths to show when API fails
const fallbackHadiths = [
  {
    arabic: 'إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى',
    english: 'The reward of deeds depends upon the intentions and every person will get the reward according to what he has intended.',
    reference: 'Sahih Bukhari, Hadith 1',
    book: 'Sahih Bukhari'
  },
  {
    arabic: 'مَنْ كَانَ يُؤْمِنُ بِاللَّهِ وَالْيَوْمِ الْآخِرِ فَلْيَقُلْ خَيْرًا أَوْ لِيَصْمُتْ',
    english: 'Whoever believes in Allah and the Last Day, let him speak good or remain silent.',
    reference: 'Sahih Bukhari, Hadith 6018',
    book: 'Sahih Bukhari'
  },
  {
    arabic: 'يَا عَلِيُّ لَا تَغْضَبْ فَإِذَا غَضِبْتَ فَاقْعُدْ وَ تَفَكَّرْ فِي قُدْرَةِ الرَّبِّ عَلَى الْعِبَادِ وَ حِلْمِهِ عَنْهُمْ',
    english: 'O Ali! Do not get angry, and if you do get angry, then sit down and reflect upon the power of your Lord over His creation and His clemency towards them in spite of it.',
    reference: 'Bihar al-Anwar, vol. 74, pg. 69',
    book: 'Bihar al-Anwar'
  }
];

// Function to fetch random hadith with improved error handling
const fetchRandomHadith = async () => {
  try {
    console.log('Fetching hadith...');
    
    // First try to use the API
    try {
      // Construct URL with specific parameters for Sahih Bukhari
      const apiUrl = `${API_URL}?apiKey=${API_KEY}&book=sahih-bukhari&pagination=1&random=true`;
      console.log('API URL:', apiUrl);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(apiUrl, { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Response keys:', Object.keys(data));
      
      // Check if API returned valid data
      if (!data) {
        throw new Error('No data returned from API');
      }

      // Handle different possible response structures
      let hadith;
      if (data.hadiths && data.hadiths.length > 0) {
        hadith = data.hadiths[0];
      } else if (data.hadith) {
        hadith = data.hadith;
      } else if (data.data && data.data.hadiths && data.data.hadiths.length > 0) {
        hadith = data.data.hadiths[0];
      } else if (data.data && data.data.hadith) {
        hadith = data.data.hadith;
      } else {
        console.log('Available data structure:', JSON.stringify(data, null, 2));
        throw new Error('No hadith found in API response');
      }
      
      // Validate hadith data before returning
      if (!hadith || !hadith.arabic || !hadith.english) {
        console.error('Invalid hadith data:', hadith);
        throw new Error('Incomplete hadith data returned');
      }
      
      return {
        arabic: hadith.arabic,
        english: hadith.english,
        reference: `Sahih Bukhari, Hadith ${hadith.hadithNumber || 'N/A'}`,
        book: 'Sahih Bukhari',
        chapter: hadith.chapter || 'N/A',
        source: 'api'
      };
    } catch (apiError) {
      console.error('API fetch failed, falling back to local data:', apiError);
      throw apiError; // Propagate to the outer catch
    }
  } catch (error) {
    console.error('Error fetching hadith:', error);
    // Return a random fallback hadith
    const randomIndex = Math.floor(Math.random() * fallbackHadiths.length);
    return {
      ...fallbackHadiths[randomIndex],
      source: 'fallback'
    };
  }
};

// Function to schedule daily notification
const scheduleDailyNotification = async (hadithData) => {
  try {
    // Request permissions first
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permissions not granted');
      return;
    }

    // If no hadith data provided, fetch one
    const notificationHadith = hadithData || await fetchRandomHadith();

    // Cancel previous notification if exists
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Schedule new daily notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Daily Hadith",
        body: `Tap to read today's hadith from ${notificationHadith.book}`,
        data: notificationHadith
      },
      trigger: {
        hour: 8, // Send at 8 AM daily
        minute: 0,
        repeats: true
      }
    });
    
    console.log('Notification scheduled successfully');
    return notificationHadith;
  } catch (error) {
    console.error('Failed to schedule notification:', error);
    return hadithData; // Return original hadith even if notification fails
  }
};

// Hadith Display Component
const HadithDisplay = ({ hadith, onRefresh }) => {
  const [isSharing, setIsSharing] = useState(false);
  
  const handleShare = async () => {
    try {
      setIsSharing(true);
      await Share.share({
        message: `${hadith.arabic}\n\n${hadith.english}\n\n${hadith.reference}`,
        title: 'Daily Hadith'
      });
    } catch (error) {
      console.error('Error sharing hadith:', error);
      Alert.alert('Sharing Error', 'Unable to share this hadith at the moment.');
    } finally {
      setIsSharing(false);
    }
  };

  const isFromFallback = hadith.source === 'fallback';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1e3a5f" />
      <View style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.date}>{getFormattedDate()}</Text>
          {isFromFallback && (
            <View style={styles.fallbackBadge}>
              <Text style={styles.fallbackText}>Offline Mode</Text>
            </View>
          )}
        </View>
        
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="star-outline" size={24} color="#fff" />
          </TouchableOpacity>
          
          <Text style={styles.narrator}>Prophet Muhammad (SAWA)</Text>
          
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={handleShare}
            disabled={isSharing}
          >
            <Ionicons 
              name={isSharing ? "hourglass-outline" : "share-social-outline"} 
              size={24} 
              color="#fff" 
            />
          </TouchableOpacity>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.arabicText}>{hadith.arabic}</Text>
          
          <Text style={styles.englishText}>{hadith.english}</Text>
          
          <Text style={styles.reference}>{hadith.reference}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Text style={styles.refreshButtonText}>Load New Hadith</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// Main App Component
const App = () => {
  const [todaysHadith, setTodaysHadith] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ensure we always have a hadith to display, even on first load
  const ensureHadithExists = () => {
    // If for some reason we still don't have a hadith, use the first fallback
    if (!todaysHadith) {
      setTodaysHadith({
        ...fallbackHadiths[0],
        source: 'fallback'
      });
    }
  };

  // Load saved hadith or fetch new one
  const loadHadith = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // If not forcing refresh, try to get today's saved hadith
      if (!forceRefresh) {
        try {
          const savedHadith = await AsyncStorage.getItem('todaysHadith');
          if (savedHadith) {
            const parsedHadith = JSON.parse(savedHadith);
            setTodaysHadith(parsedHadith);
            
            // Still schedule notification but don't wait for it
            scheduleDailyNotification(parsedHadith).catch(console.error);
            
            setLoading(false);
            return;
          }
        } catch (storageError) {
          console.error('Storage error:', storageError);
          // Continue to fetch new hadith if storage fails
        }
      }
      
      // If forcing refresh or no saved hadith, fetch a new one
      console.log('Fetching new hadith...');
      const newHadith = await fetchRandomHadith();
      console.log('New hadith fetched:', newHadith);
      
      setTodaysHadith(newHadith);
      
      // Try to save but don't block on it
      AsyncStorage.setItem('todaysHadith', JSON.stringify(newHadith))
        .catch(e => console.error('Failed to save hadith:', e));
      
      // Schedule notification with new hadith
      scheduleDailyNotification(newHadith).catch(console.error);
      
    } catch (error) {
      console.error('Error in loadHadith:', error);
      setError(error.message);
      
      // Ensure we have a fallback
      const fallbackHadith = {
        ...fallbackHadiths[0],
        source: 'fallback'
      };
      setTodaysHadith(fallbackHadith);
    } finally {
      setLoading(false);
      // Double check we have a hadith to display after a short delay
      setTimeout(ensureHadithExists, 500);
    }
  };

  // Handle refresh button
  const handleRefresh = () => {
    loadHadith(true);
  };

  useEffect(() => {
    // Load hadith when component mounts
    loadHadith();

    // Handle notification interactions
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const hadithData = response.notification.request.content.data;
      if (hadithData) {
        setTodaysHadith(hadithData);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.remove();
    };
  }, []);

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1e3a5f" />
        <Text style={styles.loadingText}>Loading today's hadith...</Text>
      </SafeAreaView>
    );
  }

  // Error state with fallback hadith display
  if (error && todaysHadith) {
    return (
      <>
        <HadithDisplay 
          hadith={todaysHadith} 
          onRefresh={handleRefresh} 
        />
        <View style={styles.errorFloatingContainer}>
          <TouchableOpacity 
            style={styles.errorFloatingButton}
            onPress={() => setError(null)}
          >
            <Ionicons name="close-circle" size={20} color="#fff" />
            <Text style={styles.errorButtonText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  // Critical error state (no hadith at all)
  if (error && !todaysHadith) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#cf4546" />
        <Text style={styles.errorText}>Failed to load hadith</Text>
        <Text style={styles.errorDetail}>{error}</Text>
        <Button 
          title="Try Again" 
          onPress={handleRefresh} 
          color="#1e3a5f"
        />
      </SafeAreaView>
    );
  }

  return todaysHadith ? (
    <HadithDisplay 
      hadith={todaysHadith} 
      onRefresh={handleRefresh} 
    />
  ) : (
    // Fallback rendering if somehow we still don't have a hadith
    <SafeAreaView style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#1e3a5f" />
      <Text style={styles.loadingText}>Loading hadith...</Text>
      <Button 
        title="Load Hadith Now" 
        onPress={handleRefresh} 
        color="#1e3a5f"
      />
    </SafeAreaView>
  );
};

// App Styles
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    gap: 16
  },
  loadingText: {
    fontSize: 18,
    color: '#1e3a5f',
    marginTop: 16
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 24,
    gap: 16
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#cf4546',
    marginTop: 12
  },
  errorDetail: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 24
  },
  errorFloatingContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 100
  },
  errorFloatingButton: {
    backgroundColor: '#cf4546',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  errorButtonText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: '500'
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  card: {
    flex: 1,
    maxHeight: '90%',
    marginVertical: 20,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1e3a5f'
  },
  header: {
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    justifyContent: 'center'
  },
  date: {
    color: '#fff',
    fontSize: 16
  },
  fallbackBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10
  },
  fallbackText: {
    color: '#fff',
    fontSize: 12
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16
  },
  narrator: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500'
  },
  iconButton: {
    padding: 8
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center'
  },
  arabicText: {
    color: '#fff',
    fontSize: 22,
    textAlign: 'center',
    lineHeight: 40,
    fontWeight: '500',
    marginBottom: 24
  },
  englishText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 40
  },
  reference: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20
  },
  refreshButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginHorizontal: 32,
    marginBottom: 24,
    borderRadius: 8
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500'
  }
});

export default App;