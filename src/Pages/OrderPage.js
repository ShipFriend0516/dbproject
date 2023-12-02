import Header from "../Components/Header";
import styles from "../Styles/OrderPage.module.css";
import { useState, useEffect, useRef } from "react";
import { loadPaymentWidget, PaymentWidgetInstance } from "@tosspayments/payment-widget-sdk";
import { nanoid } from "nanoid";
import tossLogo from "../Images/Toss_Logo_Secondary_Gray.png";
import { useNavigate } from "react-router";
import axios from "axios";
import { useSelector } from "react-redux";

const OrderPage = () => {
  const clientKey = process.env.REACT_APP_TOSSPAYMENTS_CLIENT_KEY;
  const apiKey = process.env.REACT_APP_TOSSPAYMENTS_SECRET_KEY;

  const customerKey = "fdafiodjv231ksjf";
  const paymentWidgetRef = useRef(null);
  const price = 50_000;

  const [paymentWay, setPaymentWay] = useState(0);
  // 상품 상태
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  let totalPrice = 0;
  const deliveryFee = 2000;
  let salePrice = 0;

  // 로딩
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // 로그인 여부
  const isLoggedIn = useSelector((state) => state.auth.isLoggedIn);

  // 상품 정보 조회 API
  const getCartItems = async () => {
    const user = sessionStorage.getItem("user");

    if (user) {
      const userToken = JSON.parse(user).accessToken;
      axios.defaults.headers.common["Authorization"] = `Bearer ${userToken}`;

      const response = await axios.get("http://localhost:8080/carts");
      const userCartList = await response.data.items;
      // URL에서 매개변수 추출
      const queryParams = new URLSearchParams(window.location.search);
      const checkedItemsString = queryParams.get("checkedItems");
      if (checkedItemsString) {
        // 쉼표로 구분된 문자열을 다시 배열로 변환
        const checkedItemsArray = checkedItemsString.split(",");
        console.log(checkedItemsArray);
        const selectedCartList = userCartList.filter((cartItem) =>
          checkedItemsArray.includes(cartItem.productId.toString())
        );

        setCart(selectedCartList);
        return selectedCartList;
      }

      setCart(userCartList);

      return userCartList;
    } else {
      console.log("User not found");
      return null;
    }
  };

  const getCartItemsDetail = async () => {
    const cartItems = await getCartItems();
    // 상품 정보 디테일을 담을 빈 배열 선언
    const cartItemsDetails = [];
    if (cart) {
      try {
        for (const cartItem of cartItems) {
          const productID = cartItem.productId; // await 제거
          const productDetail = await axios.get(
            `http://localhost:8080/products/${productID}/details`
          );
          cartItemsDetails.push(productDetail.data);
        }
        setProducts(cartItemsDetails);
        setLoading(false);
      } catch (error) {
        console.log(error);
      }
    }
  };
  // 로그인 여부 확인
  useEffect(() => {
    if (!loading) {
      if (!isLoggedIn) {
        navigate("/");
      }
    }
  }, [loading, isLoggedIn]);

  // 상품의 정보를 읽어오는 요청
  useEffect(() => {
    getCartItemsDetail();
  }, []);

  useEffect(() => {
    (async () => {
      // console.log(clientKey);
      const paymentWidget = await loadPaymentWidget(clientKey, customerKey);

      paymentWidget.renderPaymentMethods("#payment-widget", price);

      paymentWidgetRef.current = paymentWidget;
    })();
  }, []);

  const payBtnClick = async () => {
    const paymentWidget = paymentWidgetRef.current;

    try {
      await paymentWidget?.requestPayment({
        orderId: nanoid(),
        orderName: "지구를 지켜요 후드티",
        customerName: "지구인",
        customerEmail: "orbita@gmail.com",
        successUrl: `${window.location.origin}/success`,
        failUrl: `${window.location.origin}/fail`,
      });
    } catch (err) {
      console.log(err);
    }
  };

  // 상품 가격과 상품 선택
  const findKeyByValue = (arr, value) => {
    for (let index = 0; index < arr.length; index++) {
      if (arr[index].productOptionId === value) {
        return index;
      }
    }
    return -1; // 찾지 못한 경우
  };

  return (
    <div>
      <Header isFixed={true} />
      <div className={`${styles.bg}`}>
        {loading ? (
          <div className="w-100 p-5 d-flex justify-content-center">
            <div className="spinner-grow text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            <div className={`d-block bold text-center ${styles.titleBox}`}>
              <span className={`${styles.title}`}>주문서 작성</span>
            </div>
            <div className={`bg-white ${styles.bill}`}>
              <p className="bold fs-5 mb-2">주문 상품 목록({cart.length})</p>
              <div className={`${styles.itemGrid}`}>
                <div className={`${styles.gridheader} bold`}>
                  <span>상품 정보</span>
                  <span>옵션</span>
                  <span>가격</span>
                  <span>수량</span>
                  <span>총 금액</span>
                </div>
                {products.map((product, index) => {
                  const optionId = parseInt(cart[index].productOptionId);
                  const optionIndex = parseInt(findKeyByValue(product.options, optionId));
                  const price = product.options[optionIndex].price;
                  const quantity = parseInt(cart[index].quantity);
                  totalPrice += price * quantity;
                  return (
                    <div className={styles.productRow} key={product.productId}>
                      <span>
                        <img src={product.thumbnailImageUrl} alt={product.title + "이미지"}></img>
                        <span>{product.title}</span>
                      </span>
                      <span>{product.options[optionIndex].title}</span>
                      <span>{price.toLocaleString()}원</span>
                      <span>{cart[index].quantity}</span>
                      <span>{(price * parseInt(cart[index].quantity)).toLocaleString()}원</span>
                    </div>
                  );
                })}
              </div>
              <div className={`d-flex flex-row`}>
                <div className={`mt-3 flex-grow-3 ${styles.leftSide}`}>
                  <div className={`${styles.section}`}>
                    <p className="bold fs-5 mb-2">할인 혜택</p>
                    <div>
                      쿠폰 : 0장
                      <button className="ms-3">쿠폰 선택</button>
                    </div>
                    <div>총 할인 혜택 : 0원</div>
                  </div>
                  <div className={`${styles.section}`}>
                    <p className="bold fs-5 mb-2">주문자 정보</p>
                    <table className={`${styles.tbl_order}`}>
                      <tbody>
                        <tr>
                          <th scope="row">이름</th>
                          <td>
                            <input className="form-control" type="text" />
                          </td>
                        </tr>
                        <tr className={`${styles.tel}`}>
                          <th scope="row">전화번호</th>
                          <td>
                            <div className="row">
                              <div className="col">
                                <input className="form-control" type="text" />
                              </div>
                              -{" "}
                              <div className="col">
                                <input className="form-control" type="text" />
                              </div>
                              -{" "}
                              <div className="col">
                                <input className="form-control" type="text" />
                              </div>
                            </div>
                          </td>
                        </tr>
                        <tr className={`${styles.phone}`}>
                          <th scope="row">휴대폰번호</th>
                          <td>
                            <div className="row">
                              <div className="col">
                                <select
                                  name="cp[]"
                                  defaultValue="010"
                                  className="required form-select"
                                >
                                  <option value="010">010</option>
                                  <option value="011">011</option>
                                  <option value="016">016</option>
                                  <option value="017">017</option>
                                  <option value="019">019</option>
                                </select>{" "}
                              </div>
                              -{" "}
                              <div className="col">
                                <input className="form-control" type="text" />
                              </div>
                              -{" "}
                              <div className="col">
                                <input className="form-control" type="text" />
                              </div>
                            </div>
                          </td>
                        </tr>
                        <tr className={`${styles.email}`}>
                          <th scope="row">이메일</th>
                          <td>
                            <input
                              className="form-control"
                              type="text"
                              data-require_msg="이메일주소를"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className={`${styles.section}`}>
                    <p className="bold fs-5 mb-2">배송지 정보</p>
                    <table className={`${styles.tbl_order}`}>
                      <tbody>
                        <tr>
                          <th scope="row">받는 분 이름</th>
                          <td>
                            <input className="form-control" type="text" />
                          </td>
                        </tr>
                        <tr className={`${styles.address}`}>
                          <th scope="row">주소</th>
                          <td>
                            <div className="row">
                              <div className="col">
                                <input
                                  className="form-control"
                                  type="text"
                                  placeholder="우편 번호"
                                />
                              </div>
                              <div className="col">
                                <button>우편번호 찾기</button>
                              </div>
                            </div>
                            <div className="row">
                              <div className="col">
                                <input className="form-control" type="text" placeholder="주소" />
                              </div>
                              <div className="col">
                                <input
                                  className="form-control"
                                  type="text"
                                  placeholder="상세 주소"
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                        <tr className={`${styles.email}`}>
                          <th scope="row">배송 요청사항</th>
                          <td>
                            <input
                              className="form-control"
                              type="text"
                              data-require_msg="배송요청사항"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className={`${styles.section}`}>
                    <p className="bold fs-5 mb-2">결제 방법 선택</p>
                    <div className={` ${styles.paymentWays}`}>
                      <button
                        onClick={() => {
                          setPaymentWay(0);
                        }}
                        className={`${styles.toss} ${paymentWay === 0 ? styles.tossChecked : ""}`}
                      ></button>
                      <button
                        onClick={() => {
                          setPaymentWay(1);
                        }}
                        className={paymentWay === 1 ? `${styles.checked}` : ""}
                      >
                        계좌이체
                      </button>
                    </div>
                  </div>
                </div>
                <div className={`flex-grow-2 ${styles.rightSide}`}>
                  <div className={`${styles.box}`}>
                    <p style={{ fontWeight: "bold" }}>결제정보</p>
                    <table>
                      <tbody>
                        <tr>
                          <td>총 상품금액</td>
                          <td>{totalPrice.toLocaleString()}원</td>
                        </tr>
                        <tr>
                          <td>배송비</td>
                          <td>{deliveryFee.toLocaleString()}원</td>
                        </tr>
                        <tr>
                          <td>할인혜택</td>
                          <td>- {salePrice.toLocaleString()}원</td>
                        </tr>
                      </tbody>
                    </table>
                    <div className="mt-3 d-flex flex-row justify-content-between align-items-center">
                      <p style={{ fontWeight: "bold" }}>총 결제금액</p>
                      <p style={{ fontWeight: "bold", color: "red" }}>
                        {(totalPrice + deliveryFee - salePrice).toLocaleString()}원
                      </p>
                    </div>
                  </div>
                  <button onClick={payBtnClick}>결제하기</button>
                  <button
                    onClick={() => {
                      navigate(-1);
                    }}
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderPage;
