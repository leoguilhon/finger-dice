import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

const COLORS = ['#FF3B30', '#34C759', '#007AFF', '#FF9500', '#FFD700', '#FF69B4'];

export default function TouchScreen({ route }) {
  const mode = route?.params?.mode || 'random'; // "random" ou "group"

  const [touches, setTouches] = useState({});
  const [colors, setColors] = useState({});
  const [countdown, setCountdown] = useState(10);
  const [timerStarted, setTimerStarted] = useState(false);

  // Resultado dos sorteios
  const [selectedCircle, setSelectedCircle] = useState(null); // { id, x, y, color }
  const [groupAssignments, setGroupAssignments] = useState({}); // { id: 'red'|'blue' }

  // Posições congeladas na hora do sorteio (para o modo group)
  const [frozenPositions, setFrozenPositions] = useState(null); // { id: {x, y} }

  const [restartScheduled, setRestartScheduled] = useState(false);

  const timerRef = useRef(null);
  const restartRef = useRef(null);
  const touchesRef = useRef({});
  const colorsRef = useRef({});
  const sorteioFeito = useRef(false);

  useEffect(() => {
    touchesRef.current = touches;
  }, [touches]);

  useEffect(() => {
    colorsRef.current = colors;
  }, [colors]);

  const hasResult = () => !!selectedCircle || Object.keys(groupAssignments).length > 0;

  const handleStartTouch = (e) => {
    // Durante os 2s pós-sorteio, ignoramos novos toques para não bagunçar a tela congelada
    if (hasResult()) return;
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

    if (!timerStarted && Object.keys(newTouches).length > 0) {
      setTimerStarted(true);
      startCountdown();
    }
  };

  const handleMoveTouch = (e) => {
    if (hasResult()) return; // não mover círculos após o sorteio
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
    // Se já houve resultado, não removemos nada da tela (os círculos estão congelados)
    if (hasResult()) return;

    const changed = e.nativeEvent.changedTouches;
    const updated = { ...touches };
    for (let touch of changed) {
      delete updated[touch.identifier];
    }
    setTouches(updated);

    // Se todos os dedos saíram antes do sorteio, reseta para esperar nova rodada
    if (Object.keys(updated).length === 0) {
      resetAll();
    }
  };

  const startCountdown = () => {
    sorteioFeito.current = false;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (!sorteioFeito.current) {
            sorteioFeito.current = true;
            if (mode === 'random') {
              fazerSorteioUnico();
            } else {
              fazerSorteioGrupo();
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const agendarResetAposResultado = () => {
    if (restartScheduled) return;
    setRestartScheduled(true);
    clearTimeout(restartRef.current);
    restartRef.current = setTimeout(() => {
      resetAll();
    }, 2000);
  };

  const fazerSorteioUnico = () => {
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

    // Limpa toques para evitar movimento, mas o círculo sorteado fica porque usamos seus x/y congelados
    setTouches({});
    setColors({});

    agendarResetAposResultado();
  };

  const fazerSorteioGrupo = () => {
    const snapshot = { ...touchesRef.current };
    const ids = Object.keys(snapshot);

    if (ids.length === 0) {
      resetAll();
      return;
    }

    // Embaralha os ids
    const shuffled = [...ids].sort(() => Math.random() - 0.5);
    const meio = Math.ceil(shuffled.length / 2);
    const grupo1 = shuffled.slice(0, meio);
    const grupo2 = shuffled.slice(meio);

    const atribuicoes = {};
    grupo1.forEach((id) => (atribuicoes[id] = 'red'));
    grupo2.forEach((id) => (atribuicoes[id] = 'blue'));

    // Congela as posições no momento do sorteio
    const frozen = {};
    ids.forEach((id) => {
      frozen[id] = { x: snapshot[id].x, y: snapshot[id].y };
    });

    setGroupAssignments(atribuicoes);
    setFrozenPositions(frozen);

    // Limpa os toques ativos para impedir que novos movimentos alterem as posições
    setTouches({});
    setColors({});

    agendarResetAposResultado();
  };

  const resetAll = () => {
    clearInterval(timerRef.current);
    clearTimeout(restartRef.current);
    setTouches({});
    setColors({});
    setCountdown(10);
    setTimerStarted(false);
    setSelectedCircle(null);
    setGroupAssignments({});
    setFrozenPositions(null);
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
      {!hasResult() && timerStarted && countdown > 0 && (
        <Text style={styles.countdown}>{countdown}</Text>
      )}

      {/* Círculos ativos (antes do sorteio) */}
      {!hasResult() &&
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

      {/* Círculo sorteado (modo random) */}
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

      {/* Grupos (modo group) */}
      {Object.entries(groupAssignments).map(([id, color]) => {
        // Usa posições CONGELADAS; não some se o dedo sair
        const touch = frozenPositions?.[id];
        if (!touch) return null;
        return (
          <View
            key={id}
            style={[
              styles.circle,
              {
                left: touch.x - 50,
                top: touch.y - 50,
                backgroundColor: color === 'red' ? '#FF3B30' : '#007AFF',
                borderWidth: 3,
                borderColor: '#fff',
              },
            ]}
          />
        );
      })}

      <Text style={styles.debug}>
        Modo: {mode.toUpperCase()} | Total: {Object.keys(touches).length}
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
