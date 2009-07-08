# Be sure to restart your server when you modify this file.

# Your secret key for verifying cookie session data integrity.
# If you change this key, all old sessions will become invalid!
# Make sure the secret is at least 30 characters and all random, 
# no regular words or you'll be exposed to dictionary attacks.
ActionController::Base.session = {
  :key         => '_gears_session',
  :secret      => '53efa37d1fd0b3838b218d31092ca881a26e27857b387ad74f0ca3decb74d45b38a55b51786063fdc8300cddd3c03b47d922e06335c2b5ab92dde1fbd0796ca6'
}

# Use the database for sessions instead of the cookie-based default,
# which shouldn't be used to store highly confidential information
# (create the session table with "rake db:sessions:create")
# ActionController::Base.session_store = :active_record_store
