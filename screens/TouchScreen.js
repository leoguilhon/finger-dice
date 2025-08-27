import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const COLORS = ['#FF3B30', '#34C759', '#007AFF', '#FF9500', '#FFD700', '#FF69B4'];

export default function TouchScreen() {
  const [touches, setTouches] = useState({});
  const [colors, setColors] = useState({});
  const [countdown, setCountdown] = useState(10);
  const [timerStarted, setTimerStarted] = useState(false);
  const [selectedCircle, setSelectedCircle] = useState(null);
  const [restartScheduled, setRestartScheduled] = useState(false);

  const timerRef = useRef(null);
  const restartRef = useRef(null);
  const touchesRef = useRef({});
  const colorsRef = useRef({});
  const sorteioFeito = useRef(false);

  // Atualiza as refs sempre que os estados mudam
  useEffect(() => {
    touchesRef.current = touches;
  }, [touches]);

  useEffect(() => {
    colorsRef.current = colors;
  }, [colors]);

  const handleStartTouch = (e) => {
    if (restartScheduled) return;

    const changed = e.nativeEvent.changedTouches;
    const newTouches = { ...touches };
    const newColors = { ...colors };

    for (let touch of changed) {
      newTouches[touch.identifier] = { x: touch.pageX, y: touch.pageY };
      if (!newColors[touch.identifier]) {
        newColors[touch.identifier] = COLORS[Math.floor(Math.random() * COLORS.length)];
      }
    }

    setTouches(newTouches);
    setColors(newColors);

    if (!timerStarted && !selectedCircle) {
      setTimerStarted(true);
      startCountdown();
    }

    if (selectedCircle && !restartScheduled) {
      setRestartScheduled(true);
      restartRef.current = setTimeout(() => resetAll(), 2000);
    }
  };

  const handleMoveTouch = (e) => {
    const changed = e.nativeEvent.changedTouches;
    const updated = { ...touches };
    for (let touch of changed) {
      if (updated[touch.identifier]) {
        updated[touch.identifier] = { x: touch.pageX, y: touch.pageY };
      }
    }
    setTouches(updated);
  };

  const handleEndTouch = (e) => {
    const changed = e.nativeEvent.changedTouches;
    const updated = { ...touches };
    for (let touch of changed) {
      delete updated[touch.identifier];
    }
    setTouches(updated);

    if (Object.keys(updated).length === 0 && !selectedCircle) {
      resetAll();
    }
  };

  const startCountdown = () => {
    sorteioFeito.current = false;
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (!sorteioFeito.current) {
            sorteioFeito.current = true;
            fazerSorteio();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const fazerSorteio = () => {
    const snapshot = { ...touchesRef.current };
    const snapshotColors = { ...colorsRef.current };
    const ids = Object.keys(snapshot);

    if (ids.length === 0) {
      resetAll();
      return;
    }

    const sorteado = ids[Math.floor(Math.random() * ids.length)];

    setSelectedCircle({
      id: sorteado,
      x: snapshot[sorteado].x,
      y: snapshot[sorteado].y,
      color: snapshotColors[sorteado],
    });

    setTimeout(() => {
      setTouches({});
      setColors({});
    }, 50);
  };

  const resetAll = () => {
    clearInterval(timerRef.current);
    clearTimeout(restartRef.current);
    setTouches({});
    setColors({});
    setCountdown(10);
    setTimerStarted(false);
    setSelectedCircle(null);
    setRestartScheduled(false);
    sorteioFeito.current = false;
  };

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(restartRef.current);
    };
  }, []);

  return (
    <View
      style={styles.container}
      onTouchStart={handleStartTouch}
      onTouchMove={handleMoveTouch}
      onTouchEnd={handleEndTouch}
    >
      {!selectedCircle && timerStarted && countdown > 0 && (
        <Text style={styles.countdown}>{countdown}</Text>
      )}

      {!selectedCircle &&
        Object.entries(touches).map(([id, { x, y }]) => (
          <View
            key={id}
            style={[
              styles.circle,
              {
                left: x - 50,
                top: y - 50,
                backgroundColor: colors[id] || '#fff',
              },
            ]}
          />
        ))}

      {selectedCircle && (
        <View
          key="sorteado"
          style={[
            styles.circle,
            {
              left: selectedCircle.x - 50,
              top: selectedCircle.y - 50,
              backgroundColor: selectedCircle.color || '#fff',
              borderWidth: 3,
              borderColor: '#fff',
            },
          ]}
        />
      )}

      <Text style={styles.debug}>
        Sorteado: {selectedCircle?.id || '---'} | Cor: {selectedCircle?.color || '---'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  countdown: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  circle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    opacity: 0.9,
  },
  debug: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    color: '#0f0',
    fontSize: 14,
  },
});
