import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';

const UiTra = () => {
  const [loading, setLoading] = useState(true);
  const [drillCount, setDrillCount] = useState(0);
  const [latestDrill, setLatestDrill] = useState<any>(null);

  const fetchPracticeData = async () => {
    try {
      // 1. Fetch total count from golf_drills table
      const { count, error: countError } = await supabase
        .from('golf_drills')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;
      setDrillCount(count || 0);

      // 2. Fetch the most recent drill entry
      const { data: drillData, error: drillError } = await supabase
        .from('golf_drills')
        .select('drill_name, score, created_at, user_id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (drillError) {
        if (drillError.code === 'PGRST116') {
          setLatestDrill(null);
          return;
        }
        throw drillError;
      }

      // 3. Manually fetch profile to avoid relationship errors
      let profileData = null;
      if (drillData.user_id) {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('avatar_url, display_name')
          .eq('id', drillData.user_id)
          .maybeSingle();

        if (profileError) {
          console.log('Profile fetch warning:', profileError.message);
        } else {
          profileData = data;
        }
      }

      setLatestDrill({
        ...drillData,
        profiles: profileData
      });

    } catch (error: any) {
      console.log('fetchPracticeData error message:', error?.message);
      console.log('fetchPracticeData error details:', error?.details);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPracticeData();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }

  const dateString = latestDrill?.created_at 
    ? new Date(latestDrill.created_at).toISOString().split('T')[0] 
    : '';

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>Latest Practice</Text>
        <Text style={styles.countText}>({drillCount})</Text>
      </View>

      {latestDrill ? (
        <View style={styles.card}>
          <View style={styles.leftColumn}>
            <Text style={styles.drillName}>{latestDrill.drill_name}</Text>
            <Text style={styles.dateText}>{dateString}</Text>
            
            <View style={styles.profileBox}>
              <Image 
                source={{ uri: latestDrill.profiles?.avatar_url || 'https://via.placeholder.com/100' }} 
                style={styles.avatar} 
              />
              <Text style={styles.displayName}>{latestDrill.profiles?.display_name || 'Player'}</Text>
            </View>
          </View>

          <View style={styles.rightColumn}>
            <Text style={styles.scoreText}>{latestDrill.score}</Text>
          </View>
        </View>
      ) : (
        <Text style={{ color: '#888', textAlign: 'center' }}>No drills recorded.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  headerText: { fontSize: 22, fontWeight: 'bold', color: '#fff' }, // Dark theme
  countText: { fontSize: 18, color: '#aaa', marginLeft: 8 },
  card: {
    backgroundColor: '#1a1a1a', 
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: '#333333', // Matches Hulta GK theme
  },
  leftColumn: { flex: 1 },
  rightColumn: { justifyContent: 'center' },
  drillName: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  dateText: { fontSize: 13, color: '#888', marginVertical: 4 },
  profileBox: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  avatar: { width: 28, height: 28, borderRadius: 14, marginRight: 8 },
  displayName: { fontSize: 12, color: '#ccc' },
  scoreText: { fontSize: 40, fontWeight: 'bold', color: '#ff4444' } // High-contrast score
});

export default UiTra;