import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme';
import { useAuth } from '../auth/AuthContext';
import { API_BASE_URL } from '../api/client';
import AppScreenHeader from '../components/AppScreenHeader';

type FoodCategory = 'COMBO' | 'BEBIDA' | 'COMIDA' | 'SNACK';

type FoodProduct = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number | string;
  category: FoodCategory;
  active: boolean;
};

export default function AdminFoodScreen() {
  const { token } = useAuth();
  const [products, setProducts] = useState<FoodProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<FoodCategory>('COMBO');
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadProducts = async () => {
    if (!token) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/admin/food`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message ?? 'No se pudieron cargar las comidas.');
      }

      setProducts(data.products ?? []);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'No se pudieron cargar las comidas.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
  }, [token]);

  const toggleProduct = async (product: FoodProduct) => {
  if (!token) return;

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/food/${product.id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: product.name,
          description: product.description,
          price: Number(product.price),
          category: product.category,
          active: !product.active,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message ?? 'No se pudo actualizar el producto.');
    }

    setProducts((current) =>
      current.map((item) =>
        item.id === product.id ? data.product : item
      )
    );
  } catch (error) {
    Alert.alert(
      'Error',
      error instanceof Error ? error.message : 'No se pudo actualizar.'
    );
  }
};

  const startEditing = (product: FoodProduct) => {
  setEditingId(product.id);
  setName(product.name);
  setDescription(product.description ?? '');
  setPrice(String(product.price));
  setCategory(product.category);
};

  const createProduct = async () => {
    if (!token || !name.trim() || Number(price) <= 0) {
      Alert.alert('Datos incompletos', 'Ingresa nombre y precio.');
      return;
    }

    try {
      const response = await fetch(
  editingId
    ? `${API_BASE_URL}/api/admin/food/${editingId}`
    : `${API_BASE_URL}/api/admin/food`,
  {
    method: editingId ? 'PATCH' : 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: name.trim(),
      description: description.trim() || null,
      price: Number(price),
      category,
      active: true,
    }),
  }
);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message ?? 'No se pudo crear el producto.');
      }

      setProducts((current) =>
  editingId
    ? current.map((item) =>
        item.id === editingId ? data.product : item
      )
    : [data.product, ...current]
);
      setName('');
      setDescription('');
      setPrice('');
      setCategory('COMBO');
        setEditingId(null);

      Alert.alert('Listo', 'Producto creado correctamente.');
    } catch (error) {
      Alert.alert(
        'No se pudo crear',
        error instanceof Error ? error.message : 'Revisa los datos.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
        <AppScreenHeader eyebrow="Catálogo" title="Comidas y combos" subtitle="Administra comidas, bebidas, snacks y combos para eventos de cine." />

        <View style={styles.form}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ej. Combo clásico"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />

          <Text style={styles.label}>Descripción</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Ej. Canguil + bebida"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />

          <Text style={styles.label}>Precio</Text>
          <TextInput
            value={price}
            onChangeText={setPrice}
            placeholder="5.00"
            keyboardType="decimal-pad"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
          />

          <Text style={styles.label}>Categoría</Text>
          <View style={styles.options}>
            {(['COMBO', 'BEBIDA', 'COMIDA', 'SNACK'] as FoodCategory[]).map((item) => (
              <Pressable
                key={item}
                onPress={() => setCategory(item)}
                style={[
                  styles.option,
                  category === item && styles.optionSelected,
                ]}
              >
                <Text style={styles.optionText}>{item}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.button} onPress={() => void createProduct()}>
            <Text style={styles.buttonText}>
  {editingId ? 'Guardar cambios' : 'Agregar producto'}
</Text>
          </Pressable>
        </View>

        <Text style={styles.listTitle}>Productos registrados</Text>

        {loading ? (
          <ActivityIndicator color={colors.primary} size="large" />
        ) : products.length === 0 ? (
          <Text style={styles.empty}>Todavía no hay comidas o combos registrados.</Text>
        ) : (
          products.map((product) => (
            <View key={product.id} style={styles.product}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productMeta}>
                  {product.category} · ${Number(product.price).toFixed(2)}
                </Text>
                {product.description && (
                  <Text style={styles.productDescription}>
                    {product.description}
                  </Text>
                )}
              </View>

              <View style={styles.productActions}>
  <Pressable
  onPress={() => void toggleProduct(product)}
>
  <Text style={styles.status}>
    {product.active ? 'Activo' : 'Inactivo'}
  </Text>
</Pressable>

  <Pressable
    style={styles.editButton}
    onPress={() => startEditing(product)}
  >
    <Text style={styles.editButtonText}>Editar</Text>
  </Pressable>
</View>
            </View>
          ))
        )}
        </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: 16,
    gap: 10,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 4,
  },
  form: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  label: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  input: {
    minHeight: 44,
    backgroundColor: colors.input,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderRadius: 10,
    color: colors.text,
    paddingHorizontal: 12,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  optionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
  },
  button: {
    minHeight: 46,
    backgroundColor: colors.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  buttonText: {
    color: colors.text,
    fontWeight: '800',
  },
  listTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 6,
  },
  product: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  productMeta: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  productDescription: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },
  status: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '800',
  },
  productActions: {
  alignItems: 'flex-end',
  gap: 8,
},

editButton: {
  backgroundColor: colors.primary,
  borderRadius: 8,
  paddingHorizontal: 10,
  paddingVertical: 6,
},

editButtonText: {
  color: colors.text,
  fontSize: 11,
  fontWeight: '800',
},
  empty: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});