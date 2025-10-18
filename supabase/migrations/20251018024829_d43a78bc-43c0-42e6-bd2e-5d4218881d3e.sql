-- Update team achievements with new salary tiers
DELETE FROM team_achievements;

INSERT INTO team_achievements (name, description, milestone_amount, reward_amount, icon, color) VALUES
('🥉 Bronze', 'Reach $5,000 USDT in team deposits', 5000, 50, 'trophy', 'bronze'),
('🥈 Silver', 'Reach $10,000 USDT in team deposits', 10000, 75, 'trophy', 'silver'),
('🥇 Gold', 'Reach $20,000 USDT in team deposits', 20000, 100, 'trophy', 'gold'),
('💎 Platinum', 'Reach $40,000 USDT in team deposits', 40000, 120, 'crown', 'platinum'),
('💠 Diamond', 'Reach $80,000 USDT in team deposits', 80000, 130, 'crown', 'diamond'),
('👑 Master', 'Reach $150,000 USDT in team deposits', 150000, 150, 'crown', 'purple'),
('⚔️ Grandmaster', 'Reach $250,000 USDT in team deposits', 250000, 200, 'star', 'red'),
('🏆 Elite', 'Reach $500,000 USDT in team deposits', 500000, 300, 'star', 'blue'),
('⭐ Legend', 'Reach $1,000,000 USDT in team deposits', 1000000, 400, 'gift', 'yellow'),
('🌟 Mythic', 'Reach $2,000,000 USDT in team deposits', 2000000, 500, 'gift', 'rainbow');