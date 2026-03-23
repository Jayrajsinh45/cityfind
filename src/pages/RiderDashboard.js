import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function RiderDashboard() {
  const { currentUser, orders, updateOrderStatus, logout } = useApp();
  const [tab, setTab] = useState('available'); // available | deliveries | profile

  const myDeliveries = orders.filter(o => o.riderId === currentUser?.id);
  const availableOrders = orders.filter(o => o.status === 'pending');

  const handleAccept = async (orderId) => {
    await updateOrderStatus(orderId, 'accepted', currentUser.id);
  };

  const advanceStatus = async (orderId, currentStatus) => {
    if (currentStatus === 'accepted') await updateOrderStatus(orderId, 'picked_up');
    else if (currentStatus === 'picked_up') await updateOrderStatus(orderId, 'delivered');
  };

  const statusTags = {
    pending: { label: 'Awaiting Rider', color: '#F59E0B', bg: '#FEF3C7' },
    accepted: { label: 'Going to Shop', color: '#3B82F6', bg: '#DBEAFE' },
    picked_up: { label: 'Out for Delivery', color: '#8B5CF6', bg: '#EDE9FE' },
    delivered: { label: 'Delivered', color: '#10B981', bg: '#D1FAE5' },
  };

  const OrderCard = ({ order, isMine }) => {
    const tag = statusTags[order.status] || statusTags.pending;
    return (
      <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 20, padding: 16, marginBottom: 16, boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>ORDER #{order.id.slice(-6).toUpperCase()}</span>
          <span style={{ background: tag.bg, color: tag.color, fontSize: 11, padding: '4px 10px', borderRadius: 12, fontWeight: 700 }}>
            {tag.label}
          </span>
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 18, fontFamily: 'var(--font-display)', marginBottom: 4 }}>🏪 {order.shopName}</div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>👤 Customer: {order.customerName}</div>
        </div>

        <div style={{ background: 'var(--surface2)', padding: 12, borderRadius: 12, marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 8, color: 'var(--text3)' }}>ITEMS</div>
          {order.products.map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 4 }}>
              <span>{p.qty}x {p.name}</span>
              <span style={{ fontWeight: 600 }}>₹{p.price * p.qty}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, fontWeight: 700 }}>
            <span>Total</span>
            <span style={{ color: 'var(--primary)' }}>₹{order.total}</span>
          </div>
        </div>

        {!isMine && order.status === 'pending' && (
          <button 
            onClick={() => handleAccept(order.id)}
            style={{ width: '100%', background: 'var(--primary)', color: 'white', border: 'none', padding: 14, borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
          >
            Accept Delivery
          </button>
        )}

        {isMine && order.status === 'accepted' && (
          <button 
            onClick={() => advanceStatus(order.id, order.status)}
            style={{ width: '100%', background: '#3B82F6', color: 'white', border: 'none', padding: 14, borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
          >
            Mark as Picked Up
          </button>
        )}

        {isMine && order.status === 'picked_up' && (
          <button 
            onClick={() => advanceStatus(order.id, order.status)}
            style={{ width: '100%', background: '#8B5CF6', color: 'white', border: 'none', padding: 14, borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
          >
            Mark as Delivered
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #1A1A2E, #2A2A4A)', padding: '52px 24px 28px', borderRadius: '0 0 32px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Rider Network</p>
              <h2 style={{ fontFamily: 'var(--font-display)', color: 'white', fontSize: 22, fontWeight: 700 }}>
                {currentUser?.name?.split(' ')[0]} 🛵
              </h2>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 16 }}>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Active</div>
              <div style={{ color: 'white', fontSize: 24, fontWeight: 800 }}>{myDeliveries.filter(m => m.status !== 'delivered').length}</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.1)', padding: 16, borderRadius: 16 }}>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>Earnings</div>
              <div style={{ color: '#10B981', fontSize: 24, fontWeight: 800 }}>₹{myDeliveries.filter(m => m.status === 'delivered').length * 40}</div>
            </div>
          </div>
        </div>

        {/* Content */}
        {tab === 'available' && (
          <div style={{ padding: '24px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Available Deliveries</h3>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>Tap accept to claim a delivery.</p>
            
            {availableOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text2)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🛵</div>
                No deliveries available right now.
              </div>
            ) : (
              availableOrders.map(o => <OrderCard key={o.id} order={o} isMine={false} />)
            )}
          </div>
        )}

        {tab === 'deliveries' && (
          <div style={{ padding: '24px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 8 }}>My Deliveries</h3>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 20 }}>Manage your active and past deliveries.</p>
            
            {myDeliveries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text2)' }}>
                You haven't accepted any deliveries yet.
              </div>
            ) : (
              myDeliveries.map(o => <OrderCard key={o.id} order={o} isMine={true} />)
            )}
          </div>
        )}

        {tab === 'profile' && (
          <div style={{ padding: '24px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, marginBottom: 20 }}>Rider Profile</h3>
            <div style={{ background: 'white', borderRadius: 20, padding: 20, border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ width: 80, height: 80, background: '#FEE2E2', borderRadius: 40, margin: '0 0 16px auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, border: '4px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>👤</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>{currentUser?.name}</h2>
              <div style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 24 }}>{currentUser?.email}</div>
              
              <button 
                onClick={logout}
                style={{ width: '100%', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: 14, borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430,
        background: 'white', borderTop: '1px solid var(--border)', display: 'flex', padding: '8px 0 16px', boxShadow: '0 -4px 20px rgba(0,0,0,0.06)', zIndex: 100
      }}>
        {[
          { id: 'available', icon: '📍', label: 'Explore' },
          { id: 'deliveries', icon: '🛵', label: 'My Routes' },
          { id: 'profile', icon: '👤', label: 'Profile' }
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 0',
              color: tab === item.id ? '#1A1A2E' : 'var(--text3)', transition: 'all 0.15s'
            }}
          >
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span style={{ fontSize: 10, fontWeight: tab === item.id ? 700 : 500 }}>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
