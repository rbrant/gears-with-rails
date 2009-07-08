require 'test_helper'

class PeopleControllerTest < ActionController::TestCase
  test "should get index" do
    get :index
    assert_response :success
    assert_not_nil assigns(:people)
  end

  test "should get new" do
    get :new
    assert_response :success
  end

  test "should create person" do
    assert_difference('Person.count') do
      post :create, :person => { }
    end

    assert_redirected_to person_path(assigns(:person))
  end

  test "should show person" do
    get :show, :id => people(:one).to_param
    assert_response :success
  end

  test "should get edit" do
    get :edit, :id => people(:one).to_param
    assert_response :success
  end

  test "should update person" do
    put :update, :id => people(:one).to_param, :person => { }
    assert_redirected_to person_path(assigns(:person))
  end

  test "should destroy person" do
    assert_difference('Person.count', -1) do
      delete :destroy, :id => people(:one).to_param
    end
    assert_redirected_to people_path
  end
  
  test "should sync data, update the first and add the second" do
    person = people(:one)
    data = [
      {:last_name => 'rich', :first_name => 'brant', :remoteid => person.id },
      {:last_name => 'new', :first_name => 'person', :remoteid => '' }
    ]
    data = data.to_json
    
    assert_difference('Person.count'){
      xhr :post, :sync_up_from_gears, {:people => data}
    }
    assert_response :success
  end
  
  test "should sync data, removing remote data that was deleted locally" do
    data = []
    data = data.to_json

    xhr :post, :sync_up_from_gears, {:people => data}
    assert_response :success
    assert Person.count == 0
  end

end
