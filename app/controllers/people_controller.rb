class PeopleController < ApplicationController
  # GET /people
  # GET /people.xml
  def index
    @people = Person.all

    respond_to do |format|
      format.html # index.html.erb
      format.xml  { render :xml => @people }
      format.js { render :json => @people.to_json }
    end  
  end

  # GET /people/1
  # GET /people/1.xml
  def show
    @person = Person.find(params[:id])

    respond_to do |format|
      format.html # show.html.erb
      format.xml  { render :xml => @person }
    end
  end

  # GET /people/new
  # GET /people/new.xml
  def new
    @person = Person.new

    respond_to do |format|
      format.html # new.html.erb
      format.xml  { render :xml => @person }
    end
  end

  # GET /people/1/edit
  def edit
    @person = Person.find(params[:id])
  end

  # POST /people
  # POST /people.xml
  def create
    @person = Person.new(params[:person])

    respond_to do |format|
      if @person.save
        flash[:notice] = 'Person was successfully created.'
        format.html { redirect_to(@person) }
        format.xml  { render :xml => @person, :status => :created, :location => @person }
      else
        format.html { render :action => "new" }
        format.xml  { render :xml => @person.errors, :status => :unprocessable_entity }
      end
    end
  end
  
  def sync_up_from_gears
    # parse the json holding all the local people
     unless params[:people].nil?
       people = JSON.parse(params[:people])

       # current people prior to sycn
       existing_ids = []
       Person.find(:all).each{|p| existing_ids << p.id}

       local_remote_ids =[]
       people.each{|p| local_remote_ids << p['remoteid'] unless p['remoteid'].blank?}
       # account for local data that was originally on 
       # the remote server, but deleted locally. so, we take the original
       # people and presume that they were all succesfully dl'd when the
       # user wnet offline.  if there are missing ids, the the were
       # deleted locally.
       (existing_ids - local_remote_ids).each{|id| Person.find(id).destroy }
       
       people.each do |person|
         # blank remoteid indicates we have a new rec created in gears
         if person['remoteid'].blank?
           Person.create :first_name => person['first_name'], :last_name => person['last_name']
         else
           Person.find(person['remoteid']).update_attributes(:first_name => person['first_name'], :last_name => person['last_name'])
         end
       end
    
    end
  
    render :update do |page|
      page << "$('#notice').html('Data has succuessfully been sycnronized with the remote server.');"
    end    
  end

  # PUT /people/1
  # PUT /people/1.xml
  def update
    @person = Person.find(params[:id])

    respond_to do |format|
      if @person.update_attributes(params[:person])
        flash[:notice] = 'Person was successfully updated.'
        format.html { redirect_to(@person) }
        format.xml  { head :ok }
      else
        format.html { render :action => "edit" }
        format.xml  { render :xml => @person.errors, :status => :unprocessable_entity }
      end
    end
  end

  # DELETE /people/1
  # DELETE /people/1.xml
  def destroy
    @person = Person.find(params[:id])
    @person.destroy

    respond_to do |format|
      format.html { redirect_to(people_url) }
      format.xml  { head :ok }
    end
  end
end
