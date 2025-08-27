import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function MenuScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Finger Dice</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Touch', { mode: 'group' })}
      >
        <Text style={styles.buttonText}>Separar em Grupos</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate('Touch', { mode: 'random' })}
      >
        <Text style={styles.buttonText}>Escolher uma Pessoa</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 40 },
  button: {
    backgroundColor: '#1E90FF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginVertical: 10,
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});
