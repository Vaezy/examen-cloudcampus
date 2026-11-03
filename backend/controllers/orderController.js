// backend/controllers/orderController.js
const axios = require('axios');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const { gatewayUrl } = require('../config/services');
const orderLog = require('debug')('orderRoutes:console');


exports.createOrder = async (req, res) => {
  //userLog(`user is ${JSON.stringify(req.user)}`)
  console.log(`user is in createOrder ${JSON.stringify(req.user)}`)
  //const { items, shippingAddress, paymentMethod } = req.body;
  const { items, shippingAddress, paymentMethod, shippingMethod, } = req.body;
  console.log(`items are ${JSON.stringify(req.body)}`)
  //const { items } = req.body;
  let userId = req.user.userId;
  // let shippingAddress = {
  //   "street": "123 Main St",
  //   "city": "New York",
  //   "postalCode": "10001",
  //   "country": "USA"
  // };

  // let paymentMethod =  "Carte bancaire";


  // Vérification du format des données
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: 'Le corps de la requête doit contenir un tableau d\'objets { productId, quantity }.',
    });
  }

  try {
    const orderDetails = items.map(({ productId, quantity, price }) => {
      console.log(`Produit ID : ${productId}, Quantité : ${quantity}, Price ${price}`);
      return { productId, quantity, price };
    });

    for (const { productId, quantity } of orderDetails) {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: `Produit introuvable : ${productId}` });
      }
      if (product.stock < quantity) {
        return res.status(400).json({
          message: `Stock insuffisant pour ${product.name} (disponible : ${product.stock}).`,
        });
      }
    }

    const total = items.reduce(
      (acc, { price, quantity }) => acc + price * quantity,
      0
    );

    const newOrder = new Order({
      userId,
      items: orderDetails,
      total,
      shippingAddress,
      paymentMethod,
      shippingMethod
    });

    const savedOrder = await newOrder.save();

    console.log('Commande sauvegardée :', savedOrder);
    console.log(`[audit] order created id=${savedOrder._id} user=${userId} total=${total}`);

    for (const { productId, quantity } of orderDetails) {
      await Product.findByIdAndUpdate(productId, { $inc: { stock: -quantity } });
    }

    try {
      await Promise.all(
        orderDetails.map(({ productId, quantity }) =>
          axios.post(`${gatewayUrl}/update-stock`, { productId, quantity })
        )
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour des stocks (gateway)', error.message);
    }

    try {
      const user = await User.findById(userId).select('email username');
      if (user?.email) {
        await axios.post(`${gatewayUrl}/notify`, {
          to: user.email,
          subject: 'Nouvelle Commande Créée',
          text: `Bonjour ${user.username},\nUne commande a été créée :\n${orderDetails
            .map((item) => `Produit ID : ${item.productId}, Quantité : ${item.quantity}`)
            .join('\n')}`,
        });
      } else {
        console.warn(`[audit] notify skipped: no email for user=${userId}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification', error.message);
    }

    // Réponse de succès
    res.status(201).json({
      message: 'Commande créée avec succès',
      order: savedOrder,
    });
  } catch (error) {
    console.error('Erreur lors de la création de la commande', error);
    res.status(500).json({
      message: 'Une erreur est survenue lors de la création de la commande.',
    });
  }
};


// exports.createOrder = async (req, res) => {
//     const products = req.body; // Attente d'un tableau d'objets { productId, quantity }
//     console.log(`products are ${JSON.stringify(products)}`)
    
//     // // Vérification du format des données
//     if (!Array.isArray(products.items) || products.items.length === 0) {
//       return res.status(400).json({ message: 'Le corps de la requête doit contenir un tableau d\'objets { productId, quantity }.' });
//     }
  
//     try {
//     //   // Logique pour traiter chaque produit de la commande
//       const orderDetails = products.items.map(({ productId, quantity }) => {
//         console.log(`Produit ID : ${productId}, Quantité : ${quantity}`);
//         return { productId, quantity };
//       });

//       //TODO : requete avec le modele order pour ajouter les commande en db
  
//     //   // Appel au micro-service de notification
//       try {
//         await axios.post('http://localhost:8000/notify', {
//           to: "syaob@yahoo.fr",
//           subject: 'Nouvelle Commande Créée',
//           text: `Une commande a été créée avec succès pour les produits suivants : \n${orderDetails
//             .map((item) => `Produit ID : ${item.productId}, Quantité : ${item.quantity}`)
//             .join('\n')}`,
//         });
//       } catch (error) {
//         console.error('Erreur lors de l\'envoi de la notification', error);
//       }
  
//       // Appel au micro-service de gestion des stocks
//       try {
//         await Promise.all(
//           products.items.map(({ productId, quantity }) =>
//             axios.post('http://localhost:8000/update-stock', { productId, quantity })
//           )
//         );
//       } catch (error) {
//         console.error('Erreur lors de la mise à jour des stocks', error);
//       }
  
//       // Réponse de succès
//       res.status(201).json({
//         message: 'Commande créée avec succès',
//         orderDetails,
//       });
//     } catch (error) {
//       console.error('Erreur lors de la création de la commande', error);
//       res.status(500).json({ message: 'Une erreur est survenue lors de la création de la commande.' });
//     }
//   };

exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByIdAndDelete(id);
    if (!order) {
      return res.status(404).json({ message: 'Commande introuvable' });
    }
    console.log(`[audit] order deleted id=${id}`);
    return res.json({ message: 'Commande supprimée' });
  } catch (error) {
    console.error('Erreur lors de la suppression de la commande', error);
    return res.status(500).json({ message: 'Erreur lors de la suppression' });
  }
};

exports.getOrders = async(req, res)=>{

  const orders = await Order.find();
      res.status(200).json(orders);
 
}

exports.validateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByIdAndUpdate(
      id,
      { status: 'En cours de traitement' },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ message: 'Commande introuvable' });
    }
    console.log(`[audit] order validated id=${id}`);
    return res.json({ message: `Commande ${id} validée`, order });
  } catch (error) {
    console.error('Erreur lors de la validation de la commande', error);
    return res.status(500).json({ message: 'Erreur lors de la validation' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  console.log(`dump console log order id => ${orderId} status = ${status}`);
  try {
    // Vérification des données
    if (!status) {
      return res.status(400).json({ message: "Le statut est requis." });
    }

    // Recherche de la commande et mise à jour
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status, updatedAt: new Date() }, // Mise à jour du statut et de la date de modification
      { new: true } // Retourne la commande mise à jour
    );

    if (!order) {
      return res.status(404).json({ message: "Commande non trouvée." });
    }

    res.status(200).json({ message: "Statut mis à jour avec succès", order });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la commande :", error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};