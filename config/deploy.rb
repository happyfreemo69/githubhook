# config/deploy.rb
lock '3.4.0'
set :application, 'githubhook-server'
set :repo_url, 'git@github.com:happyfreemo69/githubhook-server.git'

set :branch, 'dev'
set :scm, :git
set :format, :pretty
set :log_level, :debug
set :node_env, (fetch(:node_env) || fetch(:stage))

set :linked_files, %w{config/privateConfig.js}
set :linked_dirs, %w{pushes node_modules}
# Default value for default_env is {}
set :default_env, { node_env: fetch(:node_env) }

set :keep_releases, 5
set :ssh_options, { :forward_agent => true, :port => 6543 }
namespace :deploy do

  desc 'Install node modules non-globally'
  task :npm_install do
    on roles(:app) do
        execute "cd #{release_path} && npm install"
    end
  end

  desc 'Start application'
  task :start do
    on roles(:app) do
      within current_path do
        execute :'forever', 'start --killSignal=SIGINT --append --uid',fetch(:application),'app.js'
      end
    end
  end

  desc 'Stop application'
  task :stop do
    on roles(:app) do
      within current_path do
        execute :'forever', 'stop',fetch(:application)
      end
    end
  end

  desc 'Restart application'
  task :restart do
    on roles(:app), in: :sequence, wait: 5 do
      within current_path do
        begin
          Rake::Task['deploy:stop'].invoke
        rescue => e
          puts "deploy:stop failed"
          puts "#{e.class}: #{e.message}"
        end
        Rake::Task['deploy:start'].invoke
      end
    end
  end

  after :publishing, :restart

  before :restart, 'deploy:npm_install'

  desc 'ensure server is correctly running'
  task :ping do
    on roles(:app), in: :sequence do
      within current_path do 
        execute :echo, 'pinging'
        execute :sleep, '4'
        system "curl -o /dev/null --max-time 10 --silent --head --write-out '%{http_code}' "+fetch(:url_ping)+"/ping | grep -q 200"
        if($?.exitstatus != 0) then
          puts 'ping failed: ' + $?.exitstatus.to_s
          exit
        end
      end
    end
  end

  after :start, 'deploy:ping'
end
